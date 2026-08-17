import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CarbonTrackerDomainException } from '../exceptions/carbon-tracker.exceptions';

/**
 * Único punto donde una excepción de negocio se traduce a HTTP.
 * El controlador y el service NO necesitan saber nada de status codes:
 * simplemente dejan que la excepción de dominio suba, y este filtro
 * la intercepta y arma la respuesta.
 */
@Catch(CarbonTrackerDomainException)
export class CarbonTrackerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CarbonTrackerExceptionFilter.name);

  catch(exception: CarbonTrackerDomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.warn(`[${exception.code}] ${exception.message}`);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
