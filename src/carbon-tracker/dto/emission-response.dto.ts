import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../domain/enums/vehicle-type.enum';
import { CarbonEmissionResult } from '../business/carbon-emission-calculator';

/**
 * VISTA (capa de presentación de la respuesta).
 * Traduce el resultado interno del Modelo al formato JSON
 * que el cliente de la API va a consumir. Si mañana cambia el
 * modelo de dominio, esta capa amortigua el impacto en el contrato público.
 */
export class EmissionResponseDto {
  @ApiProperty({ enum: VehicleType })
  vehicleType: VehicleType;

  @ApiProperty({ example: 12.5 })
  cargoWeightTons: number;

  @ApiProperty({ example: 340 })
  distanceKm: number;

  @ApiProperty({ example: 1.0 })
  efficiencyFactor: number;

  @ApiProperty({ example: 688.5, description: 'Emisiones totales en kg de CO2' })
  co2EmissionsKg: number;

  @ApiProperty({ example: 0.69, description: 'Emisiones totales en toneladas de CO2' })
  co2EmissionsTons: number;

  @ApiProperty({
    example: 33,
    description: 'Árboles equivalentes necesarios para absorber esta emisión en 1 año',
  })
  equivalentTreesToOffset: number;

  @ApiProperty({ example: '2026-08-17T10:00:00.000Z' })
  calculatedAt: string;

  static fromCalculation(
    input: {
      vehicleType: VehicleType;
      cargoWeightTons: number;
      distanceKm: number;
      efficiencyFactor: number;
    },
    result: CarbonEmissionResult,
  ): EmissionResponseDto {
    const dto = new EmissionResponseDto();
    dto.vehicleType = input.vehicleType;
    dto.cargoWeightTons = input.cargoWeightTons;
    dto.distanceKm = input.distanceKm;
    dto.efficiencyFactor = input.efficiencyFactor;
    dto.co2EmissionsKg = result.co2EmissionsKg;
    dto.co2EmissionsTons = result.co2EmissionsTons;
    dto.equivalentTreesToOffset = result.equivalentTreesToOffset;
    dto.calculatedAt = new Date().toISOString();
    return dto;
  }
}
