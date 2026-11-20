import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import {
  TrackingProvider,
  type ProviderResult,
} from './providers/tracking-provider.js';
import { TtlCache } from './ttl-cache.js';

export interface TrackingResult {
  codigo: string;
  transportadora: string;
  status: string;
  descricao: string;
  entregue: boolean;
  ultimaAtualizacao: string | null;
  eventos: ProviderResult['eventos'];
}

@Injectable()
export class TrackingService {
  readonly cache: TtlCache<TrackingResult>;

  constructor(
    private readonly provider: TrackingProvider,
    config: ConfigService<Env, true>,
  ) {
    this.cache = new TtlCache(
      config.get('CACHE_TTL_SECONDS', { infer: true }) * 1000,
    );
  }

  get providerName() {
    return this.provider.nome;
  }

  private montar(codigo: string, dados: ProviderResult): TrackingResult {
    const eventos = [...dados.eventos].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
    const ultimo = eventos[0];
    return {
      codigo,
      transportadora: dados.transportadora,
      status: ultimo?.status ?? 'sem_informacoes',
      descricao:
        ultimo?.descricao ?? 'Ainda não há movimentações para este objeto',
      entregue: ultimo?.status === 'entregue',
      ultimaAtualizacao: ultimo?.data ?? null,
      eventos,
    };
  }

  /** Consulta um código (já validado), usando o cache quando possível. */
  async rastrear(
    codigo: string,
  ): Promise<{ resultado: TrackingResult; cache: boolean }> {
    const emCache = this.cache.get(codigo);
    if (emCache) return { resultado: emCache, cache: true };

    const dados = await this.provider.rastrear(codigo);
    if (!dados) throw new NotFoundException(`Objeto ${codigo} não encontrado`);

    const resultado = this.montar(codigo, dados);
    this.cache.set(codigo, resultado);
    return { resultado, cache: false };
  }
}
