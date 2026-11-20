const crypto = require('crypto');

/**
 * Provedor de demonstração: gera um histórico fictício, porém determinístico
 * (o mesmo código sempre gera os mesmos eventos), sem depender de API externa.
 */
const ETAPAS = [
  { status: 'postado', descricao: 'Objeto postado' },
  { status: 'em_transito', descricao: 'Objeto em trânsito - por favor aguarde' },
  { status: 'em_transito', descricao: 'Objeto em trânsito - por favor aguarde' },
  { status: 'saiu_para_entrega', descricao: 'Objeto saiu para entrega ao destinatário' },
  { status: 'entregue', descricao: 'Objeto entregue ao destinatário' },
];

const CIDADES = [
  'São Paulo/SP',
  'Curitiba/PR',
  'Belo Horizonte/MG',
  'Recife/PE',
  'João Pessoa/PB',
  'Campina Grande/PB',
  'Fortaleza/CE',
  'Salvador/BA',
];

const DIA = 24 * 60 * 60 * 1000;

function seedBytes(codigo) {
  return crypto.createHash('sha256').update(codigo).digest();
}

async function rastrear(codigo) {
  const seed = seedBytes(codigo);

  // Códigos terminados em 0000 + DV simulam um objeto não encontrado
  if (codigo.slice(6, 10) === '0000') return null;

  const totalEtapas = (seed[0] % ETAPAS.length) + 1;
  const inicio = Date.now() - totalEtapas * DIA - (seed[1] % 12) * 60 * 60 * 1000;

  const eventos = ETAPAS.slice(0, totalEtapas).map((etapa, i) => ({
    data: new Date(inicio + i * DIA + (seed[i + 2] % 8) * 60 * 60 * 1000).toISOString(),
    local: CIDADES[seed[i + 8] % CIDADES.length],
    status: etapa.status,
    descricao: etapa.descricao,
  }));

  return { transportadora: 'Correios (simulado)', eventos };
}

module.exports = { nome: 'mock', rastrear };
