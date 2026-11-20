import { z } from 'zod';
import { normalizar, validar } from './codigo-rastreio.js';

export const codigoSchema = z
  .string()
  .transform(normalizar)
  .superRefine((valor, ctx) => {
    const r = validar(valor);
    if (!r.valido) ctx.addIssue({ code: 'custom', message: r.motivo });
  });

export const loteSchema = z
  .object({
    codigos: z
      .array(codigoSchema)
      .min(1, 'Informe ao menos um código')
      .max(100, 'Máximo de 100 códigos por lote')
      .transform((lista) => [...new Set(lista)]),
  })
  .strict();

export type LoteInput = z.infer<typeof loteSchema>;
