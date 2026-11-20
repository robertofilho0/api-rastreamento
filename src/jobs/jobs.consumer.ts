import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  type RmqContext,
} from '@nestjs/microservices';
import {
  BATCH_REQUESTED,
  type BatchRequestedEvent,
} from '../messaging/events.js';
import { JobsProcessor } from './jobs.processor.js';

/** Consumer RabbitMQ: confirma (ack) a mensagem depois de processar o lote. */
@Controller()
export class JobsConsumer {
  private readonly logger = new Logger(JobsConsumer.name);

  constructor(private readonly processor: JobsProcessor) {}

  @EventPattern<string>(BATCH_REQUESTED)
  async onBatchRequested(
    @Payload() event: BatchRequestedEvent,
    @Ctx() ctx: RmqContext,
  ) {
    const channel = ctx.getChannelRef();
    const message = ctx.getMessage();
    try {
      await this.processor.process(event.jobId);
      channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Falha no lote ${event.jobId}: ${(error as Error).message}`,
      );
      channel.nack(message, false, false);
    }
  }
}
