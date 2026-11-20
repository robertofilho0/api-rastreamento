const env = require('../config/env');
const getProvider = require('../providers');
const TtlCache = require('../utils/TtlCache');
const AppError = require('../utils/AppError');

const cache = new TtlCache({ ttlMs: env.CACHE_TTL_SECONDS * 1000 });

function montarResposta(codigo, dados) {
  const eventos = [...dados.eventos].sort((a, b) => new Date(b.data) - new Date(a.data));
  const ultimo = eventos[0];
  return {
    codigo,
    transportadora: dados.transportadora,
    status: ultimo?.status ?? 'sem_informacoes',
    descricao: ultimo?.descricao ?? 'Ainda não há movimentações para este objeto',
    entregue: ultimo?.status === 'entregue',
    ultimaAtualizacao: ultimo?.data ?? null,
    eventos,
  };
}

/** Consulta um código, usando o cache quando possível. */
async function rastrear(codigo) {
  const emCache = cache.get(codigo);
  if (emCache) return { ...emCache, cache: true };

  const dados = await getProvider().rastrear(codigo);
  if (!dados) throw AppError.notFound(`Objeto ${codigo} não encontrado`);

  const resposta = montarResposta(codigo, dados);
  // Objetos entregues não mudam mais: podem ficar mais tempo em cache
  cache.set(codigo, resposta);
  return { ...resposta, cache: false };
}

/** Consulta vários códigos em paralelo; falhas individuais não derrubam o lote. */
async function rastrearLote(codigos) {
  const resultados = await Promise.allSettled(codigos.map((codigo) => rastrear(codigo)));
  return resultados.map((r, i) =>
    r.status === 'fulfilled'
      ? { codigo: codigos[i], sucesso: true, dados: r.value }
      : {
          codigo: codigos[i],
          sucesso: false,
          erro: r.reason.statusCode < 500 ? r.reason.message : 'Falha ao consultar o rastreio',
        },
  );
}

module.exports = { rastrear, rastrearLote, cache };
