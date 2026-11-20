import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import type { Env } from '../config/env.js';
import { JobsProcessor } from '../jobs/jobs.processor.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { EventPublisher } from './event-publisher.js';
import { InMemoryPublisher } from './in-memory.publisher.js';
import { RabbitMqPublisher } from './rabbitmq.publisher.js';
import { rmqClientOptions } from './rmq-options.js';

@Module({
  imports: [TrackingModule],
  providers: [
    JobsProcessor,
    {
      provide: EventPublisher,
      inject: [ConfigService, JobsProcessor],
      useFactory: (
        config: ConfigService<Env, true>,
        processor: JobsProcessor,
      ) => {
        const url = config.get('RABBITMQ_URL', { infer: true });
        if (!url) return new InMemoryPublisher(processor);
        const queue = config.get('RABBITMQ_QUEUE', { infer: true });
        return new RabbitMqPublisher(
          ClientProxyFactory.create(rmqClientOptions(url, queue)),
        );
      },
    },
  ],
  exports: [EventPublisher, JobsProcessor],
})
export class MessagingModule {}
