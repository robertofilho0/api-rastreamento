import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import {
  TrackingProvider,
  type ProviderResult,
  type TrackingStatus,
} from './tracking-provider.js';

const SLUG_CORREIOS = 'brazil-correios';

const STATUS_MAP: Record<string, TrackingStatus> = {
  InfoReceived: 'postado',
  InTransit: 'em_transito',
  OutForDelivery: 'saiu_para_entrega',
  AttemptFail: 'tentativa_falhou',
  Delivered: 'entregue',
  AvailableForPickup: 'aguardando_retirada',
  Exception: 'excecao',
  Expired: 'expirado',
  Pending: 'pendente',
};

interface Checkpoint {
  checkpoint_time: string;
  city?: string;
  state?: string;
  location?: string;
  tag: string;
  message: string;
}

/** Integração com a API v4 da AfterShip (Correios e +1000 transportadoras). */
@Injectable()
export class AfterShipTrackingProvider extends TrackingProvider {
  readonly nome = 'aftership';

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  private async request(path: string, init: RequestInit = {}) {
    let response: Response;
    try {
      response = await fetch(
        `${this.config.get('AFTERSHIP_BASE_URL', { infer: true })}${path}`,
        {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            'as-api-key':
              this.config.get('AFTERSHIP_API_KEY', { infer: true }) ?? '',
          },
          signal: AbortSignal.timeout(
            this.config.get('PROVIDER_TIMEOUT_MS', { infer: true }),
          ),
        },
      );
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw new GatewayTimeoutException(
          'O serviço de rastreamento demorou demais para responder',
        );
      }
      throw new BadGatewayException(
        'Não foi possível contatar o serviço de rastreamento',
      );
    }
    const body = await response.json().catch(() => ({}));
    return { status: response.status, body };
  }

  normalizar(tracking: {
    slug: string;
    checkpoints?: Checkpoint[];
  }): ProviderResult {
    return {
      transportadora:
        tracking.slug === SLUG_CORREIOS ? 'Correios' : tracking.slug,
      eventos: (tracking.checkpoints ?? []).map((c) => ({
        data: c.checkpoint_time,
        local:
          [c.city, c.state].filter(Boolean).join('/') || c.location || null,
        status: STATUS_MAP[c.tag] ?? 'em_transito',
        descricao: c.message,
      })),
    };
  }

  async rastrear(codigo: string): Promise<ProviderResult | null> {
    // A AfterShip exige que o rastreio seja cadastrado antes da consulta
    const criar = await this.request('/trackings', {
      method: 'POST',
      body: JSON.stringify({
        tracking: { tracking_number: codigo, slug: SLUG_CORREIOS },
      }),
    });
    const jaExiste = criar.body?.meta?.code === 4003;
    if (criar.status >= 400 && !jaExiste) {
      throw new BadGatewayException(
        criar.status === 401
          ? 'Chave da AfterShip inválida'
          : 'Erro no serviço de rastreamento',
      );
    }

    const consulta = await this.request(
      `/trackings/${SLUG_CORREIOS}/${codigo}`,
    );
    if (consulta.status === 404) return null;
    if (consulta.status >= 400)
      throw new BadGatewayException('Erro no serviço de rastreamento');
    return this.normalizar(consulta.body.data.tracking);
  }
}
