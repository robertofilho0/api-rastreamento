import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  TrackingProvider,
  type ProviderResult,
  type TrackingStatus,
} from './tracking-provider.js';

const ETAPAS: { status: TrackingStatus; descricao: string }[] = [
  { status: 'postado', descricao: 'Objeto postado' },
  {
    status: 'em_transito',
    descricao: 'Objeto em trânsito - por favor aguarde',
  },
  {
    status: 'em_transito',
    descricao: 'Objeto em trânsito - por favor aguarde',
  },
  {
    status: 'saiu_para_entrega',
    descricao: 'Objeto saiu para entrega ao destinatário',
  },
  { status: 'entregue', descricao: 'Objeto entregue ao destinatário' },
];

const CIDADES = [
  'São Paulo/SP',
  'Curitiba/PR',
  'Belo Horizonte/MG',
  'Recife/PE',
  'João Pessoa/PB',
  'Campina Grande/PB',
  'Fortaleza/CE',
  'Salvador/BA',
];
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/**
 * Provedor de demonstração: histórico fictício porém determinístico
 * (o mesmo código sempre gera os mesmos eventos), sem depender de API externa.
 * Códigos cujos 4 últimos dígitos do número são 0000 simulam objeto não encontrado.
 */
@Injectable()
export class MockTrackingProvider extends TrackingProvider {
  readonly nome = 'mock';

  async rastrear(codigo: string): Promise<ProviderResult | null> {
    if (codigo.slice(6, 10) === '0000') return null;

    const seed = createHash('sha256').update(codigo).digest();
    const total = (seed[0] % ETAPAS.length) + 1;
    const inicio = Date.now() - total * DIA - (seed[1] % 12) * HORA;

    return {
      transportadora: 'Correios (simulado)',
      eventos: ETAPAS.slice(0, total).map((etapa, i) => ({
        data: new Date(
          inicio + i * DIA + (seed[i + 2] % 8) * HORA,
        ).toISOString(),
        local: CIDADES[seed[i + 8] % CIDADES.length],
        ...etapa,
      })),
    };
  }
}
