import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { normalizar, validar } from './codigo-rastreio.js';
import { codigoSchema } from './tracking.schemas.js';
import { TrackingService } from './tracking.service.js';

@ApiTags('Rastreio')
@Controller('rastreio')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  /** Só valida o código (formato e dígito verificador), sem consultar o provedor. */
  @Get(':codigo/validar')
  validar(@Param('codigo') codigo: string) {
    const normalizado = normalizar(codigo);
    return { codigo: normalizado, ...validar(normalizado) };
  }

  @Get(':codigo')
  async buscar(
    @Param('codigo', { schema: codigoSchema }) codigo: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { resultado, cache } = await this.tracking.rastrear(codigo);
    res.setHeader('X-Cache', cache ? 'HIT' : 'MISS');
    return resultado;
  }
}
