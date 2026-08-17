import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CalculateEmissionDto } from '../../src/carbon-tracker/dto/calculate-emission.dto';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(CalculateEmissionDto, payload);
  return validate(dto);
}

describe('CalculateEmissionDto (validación de forma)', () => {
  it('no produce errores con un payload completamente válido', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 12.5,
      distanceKm: 340,
      efficiencyFactor: 1.2,
    });
    expect(errors).toHaveLength(0);
  });

  it('efficiencyFactor es opcional y no produce error si se omite', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 12.5,
      distanceKm: 340,
    });
    expect(errors).toHaveLength(0);
  });

  it('rechaza un vehicleType fuera del enum', async () => {
    const errors = await validateDto({
      vehicleType: 'GASOLINA',
      cargoWeightTons: 12.5,
      distanceKm: 340,
    });
    expect(errors.some((e) => e.property === 'vehicleType')).toBe(true);
  });

  it('rechaza cargoWeightTons negativo', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: -1,
      distanceKm: 340,
    });
    expect(errors.some((e) => e.property === 'cargoWeightTons')).toBe(true);
  });

  it('rechaza cargoWeightTons igual a 0', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 0,
      distanceKm: 340,
    });
    expect(errors.some((e) => e.property === 'cargoWeightTons')).toBe(true);
  });

  it('rechaza distanceKm negativa', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 10,
      distanceKm: -50,
    });
    expect(errors.some((e) => e.property === 'distanceKm')).toBe(true);
  });

  it('rechaza distanceKm como texto no numérico', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 10,
      distanceKm: 'abc',
    });
    expect(errors.some((e) => e.property === 'distanceKm')).toBe(true);
  });

  it('rechaza efficiencyFactor por encima de 5', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 10,
      distanceKm: 100,
      efficiencyFactor: 6,
    });
    expect(errors.some((e) => e.property === 'efficiencyFactor')).toBe(true);
  });

  it('rechaza efficiencyFactor negativo', async () => {
    const errors = await validateDto({
      vehicleType: VehicleType.DIESEL,
      cargoWeightTons: 10,
      distanceKm: 100,
      efficiencyFactor: -1,
    });
    expect(errors.some((e) => e.property === 'efficiencyFactor')).toBe(true);
  });

  it('reporta múltiples errores simultáneos cuando varios campos son inválidos', async () => {
    const errors = await validateDto({
      vehicleType: 'INVALIDO',
      cargoWeightTons: -5,
      distanceKm: -10,
    });
    const properties = errors.map((e) => e.property);
    expect(properties).toEqual(
      expect.arrayContaining(['vehicleType', 'cargoWeightTons', 'distanceKm']),
    );
  });

  it('rechaza el DTO cuando faltan campos requeridos', async () => {
    const errors = await validateDto({});
    expect(errors.length).toBeGreaterThan(0);
  });
});
