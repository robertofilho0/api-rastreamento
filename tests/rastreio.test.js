const request = require('supertest');
const app = require('../src/app');
const { cache } = require('../src/services/rastreio.service');
const { gerar } = require('../src/utils/codigoRastreio');

beforeEach(() => cache.clear());

describe('GET /api/rastreio/:codigo', () => {
  it('retorna o rastreio normalizado', async () => {
    const res = await request(app).get('/api/rastreio/AA123456785BR');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      codigo: 'AA123456785BR',
      transportadora: expect.any(String),
      status: expect.any(String),
      entregue: expect.any(Boolean),
    });
    expect(res.body.eventos.length).toBeGreaterThan(0);
    expect(res.body.ultimaAtualizacao).toBe(res.body.eventos[0].data);
  });

  it('ordena eventos do mais recente para o mais antigo', async () => {
    const { body } = await request(app).get('/api/rastreio/QB473629155BR');
    const datas = body.eventos.map((e) => new Date(e.data).getTime());
    expect(datas).toEqual([...datas].sort((a, b) => b - a));
  });

  it('é determinístico para o mesmo código', async () => {
    const a = await request(app).get('/api/rastreio/AA123456785BR');
    cache.clear();
    const b = await request(app).get('/api/rastreio/AA123456785BR');
    expect(b.body.eventos.map((e) => e.descricao)).toEqual(a.body.eventos.map((e) => e.descricao));
  });

  it('usa cache na segunda consulta', async () => {
    const primeira = await request(app).get('/api/rastreio/AA123456785BR');
    const segunda = await request(app).get('/api/rastreio/aa123456785br');
    expect(primeira.headers['x-cache']).toBe('MISS');
    expect(segunda.headers['x-cache']).toBe('HIT');
    expect(segunda.body.cache).toBeUndefined();
  });

  it('retorna 400 para dígito verificador inválido', async () => {
    const res = await request(app).get('/api/rastreio/AA123456789BR');
    expect(res.status).toBe(400);
    expect(res.body.details[0].mensagem).toBe('Dígito verificador inválido');
  });

  it('retorna 404 para objeto não encontrado', async () => {
    const res = await request(app).get(`/api/rastreio/${gerar('12340000')}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/rastreio/lote', () => {
  it('consulta vários códigos, remove duplicados e isola falhas', async () => {
    const naoExiste = gerar('55550000');
    const res = await request(app)
      .post('/api/rastreio/lote')
      .send({ codigos: ['AA123456785BR', 'aa123456785br', naoExiste] });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, sucesso: 1 });
    expect(res.body.resultados[1]).toEqual({
      codigo: naoExiste,
      sucesso: false,
      erro: `Objeto ${naoExiste} não encontrado`,
    });
  });

  it('valida a lista', async () => {
    expect((await request(app).post('/api/rastreio/lote').send({ codigos: [] })).status).toBe(400);
    const muitos = Array.from({ length: 21 }, (_, i) => gerar(String(10000000 + i)));
    expect((await request(app).post('/api/rastreio/lote').send({ codigos: muitos })).status).toBe(
      400,
    );
    const invalido = await request(app)
      .post('/api/rastreio/lote')
      .send({ codigos: ['XYZ'] });
    expect(invalido.body.details[0].campo).toBe('codigos.0');
  });
});

describe('Outras rotas', () => {
  it('valida um código sem consultar', async () => {
    const res = await request(app).get('/api/rastreio/aa123456785br/validar');
    expect(res.body).toMatchObject({ codigo: 'AA123456785BR', valido: true });
  });

  it('health e 404', async () => {
    expect((await request(app).get('/health')).body).toMatchObject({
      status: 'ok',
      provider: 'mock',
    });
    expect((await request(app).get('/api/outra')).status).toBe(404);
  });
});
