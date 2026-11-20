import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { AfterShipTrackingProvider } from './providers/aftership.provider.js';
import { MockTrackingProvider } from './providers/mock.provider.js';
import { TrackingProvider } from './providers/tracking-provider.js';
import { TrackingController } from './tracking.controller.js';
import { TrackingService } from './tracking.service.js';

@Module({
  controllers: [TrackingController],
  providers: [
    MockTrackingProvider,
    AfterShipTrackingProvider,
    {
      // Strategy: escolhe o provedor pela variável TRACKING_PROVIDER
      provide: TrackingProvider,
      inject: [ConfigService, MockTrackingProvider, AfterShipTrackingProvider],
      useFactory: (
        config: ConfigService<Env, true>,
        mock: MockTrackingProvider,
        aftership: AfterShipTrackingProvider,
      ) =>
        config.get('TRACKING_PROVIDER', { infer: true }) === 'aftership'
          ? aftership
          : mock,
    },
    TrackingService,
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
