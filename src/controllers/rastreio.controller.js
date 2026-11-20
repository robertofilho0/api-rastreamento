const rastreioService = require('../services/rastreio.service');
const codigoRastreio = require('../utils/codigoRastreio');

exports.buscar = async (req, res) => {
  const { cache, ...resultado } = await rastreioService.rastrear(req.validated.params.codigo);
  res.set('X-Cache', cache ? 'HIT' : 'MISS').json(resultado);
};

exports.lote = async (req, res) => {
  const resultados = await rastreioService.rastrearLote(req.body.codigos);
  res.json({
    total: resultados.length,
    sucesso: resultados.filter((r) => r.sucesso).length,
    resultados: resultados.map(({ dados, ...r }) => {
      if (!dados) return r;
      const { cache: _cache, ...semCache } = dados;
      return { ...r, dados: semCache };
    }),
  });
};

exports.validar = (req, res) => {
  const codigo = codigoRastreio.normalizar(req.params.codigo);
  res.json({ codigo, ...codigoRastreio.validar(codigo) });
};
