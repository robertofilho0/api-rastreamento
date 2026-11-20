import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module.js';
import { JobsConsumer } from './jobs.consumer.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [MessagingModule],
  controllers: [JobsController, JobsConsumer],
  providers: [JobsService],
})
export class JobsModule {}
