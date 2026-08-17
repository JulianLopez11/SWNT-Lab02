import { Injectable, Logger } from '@nestjs/common';
import { CalculateEmissionDto } from './dto/calculate-emission.dto';
import { EmissionResponseDto } from './dto/emission-response.dto';
import { CarbonEmissionCalculator } from './business/carbon-emission-calculator';
import { EMISSION_FACTORS } from './constants/emission-factors.constant';
import { EmissionFactor } from './domain/interfaces/emission-factor.interface';

/**
 * Orquestación de la petición: arma el input para la lógica de negocio y
 * da forma a la respuesta. NO valida ni calcula por sí mismo -- eso es
 * responsabilidad exclusiva de CarbonEmissionCalculator. Si la validación
 * falla, la excepción de dominio sube tal cual; el CarbonTrackerExceptionFilter
 * es quien decide cómo se ve eso en HTTP.
 */
@Injectable()
export class CarbonTrackerService {
  private readonly logger = new Logger(CarbonTrackerService.name);

  calculateEmission(dto: CalculateEmissionDto): EmissionResponseDto {
    const efficiencyFactor = dto.efficiencyFactor ?? 1.0;

    const result = CarbonEmissionCalculator.calculate({
      vehicleType: dto.vehicleType,
      cargoWeightTons: dto.cargoWeightTons,
      distanceKm: dto.distanceKm,
      efficiencyFactor,
    });

    this.logger.log(
      `Cálculo OK -> vehicleType=${dto.vehicleType}, co2Kg=${result.co2EmissionsKg}`,
    );

    return EmissionResponseDto.fromCalculation(
      { ...dto, efficiencyFactor },
      result,
    );
  }

  getEmissionFactors(): EmissionFactor[] {
    return Object.values(EMISSION_FACTORS);
  }
}
