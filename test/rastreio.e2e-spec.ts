import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { gerar } from '../src/tracking/codigo-rastreio.js';
import { TrackingService } from '../src/tracking/tracking.service.js';
import { createApp, resetDb } from './helpers/app.js';

let app: INestApplication;
let prisma: PrismaService;
let http: Awaited<ReturnType<typeof createApp>>['http'];

/** Espera o worker concluir o lote (assíncrono, via RabbitMQ ou em memória). */
async function esperarLote(id: string, timeout = 8000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeout) {
    const { body } = await http().get(`/api/lotes/${id}`);
    if (body.status === 'DONE' || body.status === 'FAILED') return body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('O lote não foi concluído a tempo');
}

beforeAll(async () => {
  ({ app, prisma, http } = await createApp());
});
beforeEach(async () => {
  await resetDb(prisma);
  app.get(TrackingService).cache.clear();
});
afterAll(() => app.close());

describe('GET /api/rastreio/:codigo', () => {
  it('retorna o rastreio normalizado com eventos do mais recente ao mais antigo', async () => {
    const res = await http().get('/api/rastreio/AA123456785BR').expect(200);
    expect(res.body).toMatchObject({
      codigo: 'AA123456785BR',
      transportadora: expect.any(String),
      entregue: expect.any(Boolean),
    });
    expect(res.body.ultimaAtualizacao).toBe(res.body.eventos[0].data);
    const datas = res.body.eventos.map((e: { data: string }) =>
      new Date(e.data).getTime(),
    );
    expect(datas).toEqual([...datas].sort((a, b) => b - a));
  });

  it('usa cache na segunda consulta', async () => {
    expect(
      (await http().get('/api/rastreio/AA123456785BR')).headers['x-cache'],
    ).toBe('MISS');
    expect(
      (await http().get('/api/rastreio/aa123456785br')).headers['x-cache'],
    ).toBe('HIT');
  });

  it('valida o dígito verificador e trata objeto não encontrado', async () => {
    const invalido = await http()
      .get('/api/rastreio/AA123456789BR')
      .expect(400);
    expect(invalido.body.errors[0].mensagem).toBe(
      'Dígito verificador inválido',
    );
    await http()
      .get(`/api/rastreio/${gerar('12340000')}`)
      .expect(404);
  });

  it('valida sem consultar', async () => {
    const res = await http()
      .get('/api/rastreio/aa123456785br/validar')
      .expect(200);
    expect(res.body).toMatchObject({ codigo: 'AA123456785BR', valido: true });
  });
});

describe('Lotes (processamento assíncrono)', () => {
  it('agenda o lote (202), remove duplicados e processa em segundo plano', async () => {
    const naoExiste = gerar('55550000');
    const criado = await http()
      .post('/api/lotes')
      .send({
        codigos: ['AA123456785BR', 'aa123456785br', 'QB473629155BR', naoExiste],
      })
      .expect(202);
    expect(criado.body).toMatchObject({
      total: 3,
      statusUrl: `/api/lotes/${criado.body.id}`,
    });

    const lote = await esperarLote(criado.body.id);
    expect(lote).toMatchObject({
      status: 'DONE',
      total: 3,
      processed: 3,
      succeeded: 2,
      progress: 100,
    });
    expect(lote.resultados.map((r: { status: string }) => r.status)).toEqual([
      'sucesso',
      'sucesso',
      'erro',
    ]);
    expect(lote.resultados[2]).toMatchObject({
      codigo: naoExiste,
      erro: `Objeto ${naoExiste} não encontrado`,
    });
    expect(lote.resultados[0].dados).toMatchObject({ codigo: 'AA123456785BR' });
  });

  it('valida a lista de códigos', async () => {
    await http().post('/api/lotes').send({ codigos: [] }).expect(400);
    const muitos = Array.from({ length: 101 }, (_, i) =>
      gerar(String(10000000 + i)),
    );
    await http().post('/api/lotes').send({ codigos: muitos }).expect(400);
    const invalido = await http()
      .post('/api/lotes')
      .send({ codigos: ['XYZ'] })
      .expect(400);
    expect(invalido.body.errors[0].campo).toBe('codigos.0');
  });

  it('retorna 404 para lote inexistente', async () => {
    await http()
      .get('/api/lotes/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it.runIf(process.env.RABBITMQ_URL)(
    'processa um lote grande pela fila do RabbitMQ',
    async () => {
      const codigos = Array.from({ length: 30 }, (_, i) =>
        gerar(String(20000001 + i)),
      );
      const { body } = await http()
        .post('/api/lotes')
        .send({ codigos })
        .expect(202);
      const lote = await esperarLote(body.id, 15_000);
      expect(lote).toMatchObject({
        status: 'DONE',
        processed: 30,
        succeeded: 30,
      });
    },
  );
});

it('health check e documentação', async () => {
  expect((await http().get('/api/health').expect(200)).body.database).toBe(
    'up',
  );
  await http().get('/docs').expect(200);
});
