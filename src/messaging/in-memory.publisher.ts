import { Logger } from '@nestjs/common';
import type { JobsProcessor } from '../jobs/jobs.processor.js';
import { EventPublisher } from './event-publisher.js';
import { BATCH_REQUESTED, type BatchRequestedEvent } from './events.js';

/** Sem RABBITMQ_URL: processa o lote em segundo plano no próprio processo. */
export class InMemoryPublisher extends EventPublisher {
  private readonly logger = new Logger(InMemoryPublisher.name);

  constructor(private readonly processor: JobsProcessor) {
    super();
  }

  async publish(pattern: string, payload: object): Promise<void> {
    if (pattern !== BATCH_REQUESTED) return;
    setImmediate(() => {
      this.processor
        .process((payload as BatchRequestedEvent).jobId)
        .catch((error: Error) =>
          this.logger.error(`Falha ao processar lote: ${error.message}`),
        );
    });
  }
}
