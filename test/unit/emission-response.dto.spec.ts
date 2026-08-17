import { EmissionResponseDto } from '../../src/carbon-tracker/dto/emission-response.dto';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';
import { CarbonEmissionResult } from '../../src/carbon-tracker/business/carbon-emission-calculator';

describe('EmissionResponseDto.fromCalculation', () => {
  it('mapea todos los campos del input y del resultado al DTO de salida', () => {
    const input = {
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 10,
      distanceKm: 100,
      efficiencyFactor: 1,
    };
    const result: CarbonEmissionResult = {
      co2EmissionsKg: 162,
      co2EmissionsTons: 0.16,
      baseFactorUsed: 0.162,
      equivalentTreesToOffset: 8,
    };

    const dto = EmissionResponseDto.fromCalculation(input, result);

    expect(dto.vehicleType).toBe(VehicleType.DIESEL);
    expect(dto.cargoWeightTons).toBe(10);
    expect(dto.distanceKm).toBe(100);
    expect(dto.efficiencyFactor).toBe(1);
    expect(dto.co2EmissionsKg).toBe(162);
    expect(dto.co2EmissionsTons).toBe(0.16);
    expect(dto.equivalentTreesToOffset).toBe(8);
  });

  it('genera un calculatedAt en formato ISO válido y reciente', () => {
    const before = Date.now();
    const dto = EmissionResponseDto.fromCalculation(
      { vehicleType: VehicleType.ELECTRICO, cargoWeightTons: 1, distanceKm: 1, efficiencyFactor: 1 },
      { co2EmissionsKg: 1, co2EmissionsTons: 0.001, baseFactorUsed: 0.02, equivalentTreesToOffset: 1 },
    );
    const after = Date.now();

    const timestamp = new Date(dto.calculatedAt).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
