import {
  CarbonTrackerDomainException,
  InvalidVehicleTypeException,
  InvalidCargoWeightException,
  InvalidDistanceException,
  InvalidEfficiencyFactorException,
} from '../../src/carbon-tracker/exceptions/carbon-tracker.exceptions';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';

describe('Excepciones de dominio de Carbon Tracker', () => {
  it('InvalidVehicleTypeException construye el mensaje con el valor recibido y los soportados', () => {
    const error = new InvalidVehicleTypeException('GASOLINA', Object.values(VehicleType));

    expect(error).toBeInstanceOf(CarbonTrackerDomainException);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('INVALID_VEHICLE_TYPE');
    expect(error.name).toBe('InvalidVehicleTypeException');
    expect(error.message).toContain('GASOLINA');
    expect(error.message).toContain('ELECTRICO');
  });

  it('InvalidCargoWeightException construye el mensaje con el valor y los límites', () => {
    const error = new InvalidCargoWeightException(-5, 0.001, 60);

    expect(error.code).toBe('INVALID_CARGO_WEIGHT');
    expect(error.name).toBe('InvalidCargoWeightException');
    expect(error.message).toContain('-5');
    expect(error.message).toContain('60');
  });

  it('InvalidDistanceException construye el mensaje con el valor y los límites', () => {
    const error = new InvalidDistanceException(-10, 0.001, 20000);

    expect(error.code).toBe('INVALID_DISTANCE');
    expect(error.name).toBe('InvalidDistanceException');
    expect(error.message).toContain('-10');
  });

  it('InvalidEfficiencyFactorException construye el mensaje con el valor y los límites', () => {
    const error = new InvalidEfficiencyFactorException(10, 0.01, 5);

    expect(error.code).toBe('INVALID_EFFICIENCY_FACTOR');
    expect(error.name).toBe('InvalidEfficiencyFactorException');
    expect(error.message).toContain('10');
  });

  it('todas las subclases son sustituibles por CarbonTrackerDomainException (LSP)', () => {
    const errors: CarbonTrackerDomainException[] = [
      new InvalidVehicleTypeException('X', ['A']),
      new InvalidCargoWeightException(0, 1, 2),
      new InvalidDistanceException(0, 1, 2),
      new InvalidEfficiencyFactorException(0, 1, 2),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(CarbonTrackerDomainException);
      expect(typeof error.code).toBe('string');
      expect(error.code.length).toBeGreaterThan(0);
    });
  });

  it('maneja valores no-string (undefined/null) en el mensaje sin lanzar un error secundario', () => {
    expect(() => new InvalidVehicleTypeException(undefined, ['A'])).not.toThrow();
    expect(() => new InvalidCargoWeightException(null, 1, 2)).not.toThrow();
  });
});
