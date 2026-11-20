export type TrackingStatus =
  | 'postado'
  | 'em_transito'
  | 'saiu_para_entrega'
  | 'tentativa_falhou'
  | 'aguardando_retirada'
  | 'entregue'
  | 'excecao'
  | 'expirado'
  | 'pendente';

export interface TrackingEvent {
  data: string;
  local: string | null;
  status: TrackingStatus;
  descricao: string;
}

export interface ProviderResult {
  transportadora: string;
  eventos: TrackingEvent[];
}

/** Estratégia de consulta: cada provedor (mock, AfterShip...) implementa esta interface. */
export abstract class TrackingProvider {
  abstract readonly nome: string;
  /** Retorna `null` quando o objeto não existe no provedor. */
  abstract rastrear(codigo: string): Promise<ProviderResult | null>;
}
