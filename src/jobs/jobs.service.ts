import { Injectable, NotFoundException } from '@nestjs/common';
import { EventPublisher } from '../messaging/event-publisher.js';
import { BATCH_REQUESTED } from '../messaging/events.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventPublisher,
  ) {}

  /** Cria o lote, publica na fila e retorna na hora (o processamento é assíncrono). */
  async create(codigos: string[]) {
    const job = await this.prisma.trackingJob.create({
      data: {
        total: codigos.length,
        items: {
          create: codigos.map((code, position) => ({ code, position })),
        },
      },
    });
    await this.events.publish(BATCH_REQUESTED, { jobId: job.id });
    return {
      id: job.id,
      status: job.status,
      total: job.total,
      statusUrl: `/api/lotes/${job.id}`,
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.trackingJob.findUnique({
      where: { id },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!job) throw new NotFoundException('Lote não encontrado');

    const { items, ...rest } = job;
    return {
      ...rest,
      progress: job.total ? Math.round((job.processed / job.total) * 100) : 100,
      resultados: items.map((i) => ({
        codigo: i.code,
        status:
          i.success === null ? 'pendente' : i.success ? 'sucesso' : 'erro',
        ...(i.error && { erro: i.error }),
        ...(i.result && { dados: i.result }),
      })),
    };
  }
}
