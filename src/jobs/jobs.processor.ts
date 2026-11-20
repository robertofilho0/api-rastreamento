import { HttpException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TrackingService } from '../tracking/tracking.service.js';

const CONCURRENCY = 5;

/** Worker: consulta os códigos de um lote (5 por vez) e grava cada resultado. */
@Injectable()
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tracking: TrackingService,
  ) {}

  async process(jobId: string): Promise<void> {
    // Idempotência: só um worker consegue tirar o lote de PENDING
    const { count } = await this.prisma.trackingJob.updateMany({
      where: { id: jobId, status: 'PENDING' },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });
    if (count === 0) return;

    try {
      const items = await this.prisma.trackingJobItem.findMany({
        where: { jobId },
        orderBy: { position: 'asc' },
      });
      for (let i = 0; i < items.length; i += CONCURRENCY) {
        await Promise.all(
          items
            .slice(i, i + CONCURRENCY)
            .map((item) => this.processItem(jobId, item.id, item.code)),
        );
      }
      await this.prisma.trackingJob.update({
        where: { id: jobId },
        data: { status: 'DONE', finishedAt: new Date() },
      });
      this.logger.log(`Lote ${jobId} concluído (${items.length} códigos)`);
    } catch (error) {
      await this.prisma.trackingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      throw error;
    }
  }

  private async processItem(jobId: string, itemId: string, code: string) {
    let data: Prisma.TrackingJobItemUpdateInput;
    try {
      const { resultado } = await this.tracking.rastrear(code);
      data = {
        success: true,
        result: resultado as unknown as Prisma.InputJsonValue,
      };
    } catch (error) {
      const expected =
        error instanceof HttpException && error.getStatus() < 500;
      data = {
        success: false,
        error: expected
          ? (error as Error).message
          : 'Falha ao consultar o rastreio',
      };
    }

    await this.prisma.$transaction([
      this.prisma.trackingJobItem.update({
        where: { id: itemId },
        data: { ...data, processedAt: new Date() },
      }),
      this.prisma.trackingJob.update({
        where: { id: jobId },
        data: {
          processed: { increment: 1 },
          ...(data.success && { succeeded: { increment: 1 } }),
        },
      }),
    ]);
  }
}
