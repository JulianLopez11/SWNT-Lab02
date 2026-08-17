import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CarbonTrackerService } from './carbon-tracker.service';
import { CalculateEmissionDto } from './dto/calculate-emission.dto';
import { EmissionResponseDto } from './dto/emission-response.dto';
import { CarbonTrackerExceptionFilter } from './filters/carbon-tracker-exception.filter';

@ApiTags('Carbon Tracker')
@Controller('carbon-tracker')
@UseFilters(CarbonTrackerExceptionFilter)
export class CarbonTrackerController {
  constructor(private readonly carbonTrackerService: CarbonTrackerService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcula las emisiones de CO2 de un viaje de transporte',
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo realizado correctamente',
    type: EmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  calculate(@Body() dto: CalculateEmissionDto): EmissionResponseDto {
    return this.carbonTrackerService.calculateEmission(dto);
  }

  @Get('factors')
  @ApiOperation({
    summary: 'Lista los factores base de emisión por tipo de vehículo',
  })
  getFactors() {
    return this.carbonTrackerService.getEmissionFactors();
  }
}
