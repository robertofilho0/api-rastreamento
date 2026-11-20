import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { uuidSchema } from '../common/schemas.js';
import { loteSchema, type LoteInput } from '../tracking/tracking.schemas.js';
import { JobsService } from './jobs.service.js';

@ApiTags('Lotes')
@Controller('lotes')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  /** Agenda a consulta de até 100 códigos. Acompanhe pelo `statusUrl`. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body({ schema: loteSchema }) body: LoteInput) {
    return this.jobs.create(body.codigos);
  }

  @Get(':id')
  findOne(@Param('id', { schema: uuidSchema }) id: string) {
    return this.jobs.findOne(id);
  }
}
