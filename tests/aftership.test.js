process.env.AFTERSHIP_API_KEY = 'chave-de-teste';
const provider = require('../src/providers/aftership.provider');

const resposta = (status, body) => ({ status, json: async () => body });

const tracking = {
  slug: 'brazil-correios',
  checkpoints: [
    {
      checkpoint_time: '2026-11-01T10:00:00Z',
      city: 'Recife',
      state: 'PE',
      tag: 'InTransit',
      message: 'Em trânsito',
    },
    {
      checkpoint_time: '2026-11-02T09:00:00Z',
      city: 'João Pessoa',
      state: 'PB',
      tag: 'Delivered',
      message: 'Entregue',
    },
  ],
};

afterEach(() => jest.restoreAllMocks());

describe('Provedor AfterShip', () => {
  it('cadastra, consulta e normaliza os eventos', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(resposta(201, { meta: { code: 201 } }))
      .mockResolvedValueOnce(resposta(200, { data: { tracking } }));

    const dados = await provider.rastrear('AA123456785BR');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers['as-api-key']).toBe('chave-de-teste');
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/trackings\/brazil-correios\/AA123456785BR$/);
    expect(dados).toEqual({
      transportadora: 'Correios',
      eventos: [
        {
          data: '2026-11-01T10:00:00Z',
          local: 'Recife/PE',
          status: 'em_transito',
          descricao: 'Em trânsito',
        },
        {
          data: '2026-11-02T09:00:00Z',
          local: 'João Pessoa/PB',
          status: 'entregue',
          descricao: 'Entregue',
        },
      ],
    });
  });

  it('aceita rastreio já cadastrado (código 4003)', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(resposta(400, { meta: { code: 4003 } }))
      .mockResolvedValueOnce(resposta(200, { data: { tracking } }));

    await expect(provider.rastrear('AA123456785BR')).resolves.toHaveProperty('eventos');
  });

  it('retorna null quando o objeto não existe', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(resposta(201, {}))
      .mockResolvedValueOnce(resposta(404, {}));

    await expect(provider.rastrear('AA123456785BR')).resolves.toBeNull();
  });

  it('converte chave inválida em erro 502', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(resposta(401, {}));
    await expect(provider.rastrear('AA123456785BR')).rejects.toMatchObject({ statusCode: 502 });
  });

  it('converte timeout em erro 504', async () => {
    const timeout = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(timeout);
    await expect(provider.rastrear('AA123456785BR')).rejects.toMatchObject({ statusCode: 504 });
  });

  it('converte falha de rede em erro 502', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(provider.rastrear('AA123456785BR')).rejects.toMatchObject({ statusCode: 502 });
  });
});
