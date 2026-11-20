import { BadGatewayException, GatewayTimeoutException } from '@nestjs/common';
import { AfterShipTrackingProvider } from './aftership.provider.js';

const config = {
  get: (key: string) =>
    ({
      AFTERSHIP_BASE_URL: 'https://api.test/v4',
      AFTERSHIP_API_KEY: 'chave-de-teste',
      PROVIDER_TIMEOUT_MS: 1000,
    })[key],
};
const resposta = (status: number, body: unknown) =>
  ({ status, json: async () => body }) as Response;

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

describe('AfterShipTrackingProvider', () => {
  const provider = new AfterShipTrackingProvider(config as never);
  afterEach(() => vi.restoreAllMocks());

  it('cadastra, consulta e normaliza os eventos', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(resposta(201, { meta: { code: 201 } }))
      .mockResolvedValueOnce(resposta(200, { data: { tracking } }));

    const dados = await provider.rastrear('AA123456785BR');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      (fetchMock.mock.calls[0][1]?.headers as Record<string, string>)[
        'as-api-key'
      ],
    ).toBe('chave-de-teste');
    expect(String(fetchMock.mock.calls[1][0])).toMatch(
      /\/trackings\/brazil-correios\/AA123456785BR$/,
    );
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
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(resposta(400, { meta: { code: 4003 } }))
      .mockResolvedValueOnce(resposta(200, { data: { tracking } }));
    await expect(provider.rastrear('AA123456785BR')).resolves.toHaveProperty(
      'eventos',
    );
  });

  it('retorna null quando o objeto não existe', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(resposta(201, {}))
      .mockResolvedValueOnce(resposta(404, {}));
    await expect(provider.rastrear('AA123456785BR')).resolves.toBeNull();
  });

  it('converte chave inválida e falha de rede em 502, e timeout em 504', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(resposta(401, {}));
    await expect(provider.rastrear('AA123456785BR')).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new TypeError('fetch failed'),
    );
    await expect(provider.rastrear('AA123456785BR')).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      Object.assign(new Error('t'), { name: 'TimeoutError' }),
    );
    await expect(provider.rastrear('AA123456785BR')).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });
});
