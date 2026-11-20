/** Pedido de processamento de um lote de rastreios. */
export const BATCH_REQUESTED = 'tracking.batch.requested';

export interface BatchRequestedEvent {
  jobId: string;
}
