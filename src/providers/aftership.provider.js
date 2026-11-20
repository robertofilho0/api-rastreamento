const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Integração com a API v4 da AfterShip (suporta Correios e +1000 transportadoras).
 * Docs: https://www.aftership.com/docs/tracking/quickstart/api-quick-start
 */
const SLUG_CORREIOS = 'brazil-correios';

const STATUS_MAP = {
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

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${env.AFTERSHIP_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'as-api-key': env.AFTERSHIP_API_KEY,
        ...options.headers,
      },
      signal: AbortSignal.timeout(env.PROVIDER_TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new AppError(504, 'O serviço de rastreamento demorou demais para responder');
    }
    throw new AppError(502, 'Não foi possível contatar o serviço de rastreamento');
  }

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

function normalizar(tracking) {
  const eventos = (tracking.checkpoints || []).map((c) => ({
    data: c.checkpoint_time,
    local: [c.city, c.state].filter(Boolean).join('/') || c.location || null,
    status: STATUS_MAP[c.tag] || 'em_transito',
    descricao: c.message,
  }));
  return { transportadora: tracking.slug === SLUG_CORREIOS ? 'Correios' : tracking.slug, eventos };
}

async function rastrear(codigo) {
  // A AfterShip exige que o rastreio seja cadastrado antes da consulta
  const criar = await request('/trackings', {
    method: 'POST',
    body: JSON.stringify({ tracking: { tracking_number: codigo, slug: SLUG_CORREIOS } }),
  });
  const jaExiste = criar.body?.meta?.code === 4003;
  if (criar.status >= 400 && !jaExiste) {
    if (criar.status === 401) throw new AppError(502, 'Chave da AfterShip inválida');
    throw new AppError(502, 'Erro no serviço de rastreamento');
  }

  const consulta = await request(`/trackings/${SLUG_CORREIOS}/${codigo}`);
  if (consulta.status === 404) return null;
  if (consulta.status >= 400) throw new AppError(502, 'Erro no serviço de rastreamento');

  return normalizar(consulta.body.data.tracking);
}

module.exports = { nome: 'aftership', rastrear, normalizar };
