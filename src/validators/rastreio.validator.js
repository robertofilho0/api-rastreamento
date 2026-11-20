const { z } = require('zod');
const codigoRastreio = require('../utils/codigoRastreio');

const codigo = z
  .string()
  .transform(codigoRastreio.normalizar)
  .superRefine((valor, ctx) => {
    const r = codigoRastreio.validar(valor);
    if (!r.valido) ctx.addIssue({ code: 'custom', message: r.motivo });
  });

const params = z.object({ codigo });

const lote = z
  .object({
    codigos: z
      .array(codigo)
      .min(1, 'Informe ao menos um código')
      .max(20, 'Máximo de 20 códigos por consulta')
      .transform((lista) => [...new Set(lista)]),
  })
  .strict();

module.exports = { params, lote };
