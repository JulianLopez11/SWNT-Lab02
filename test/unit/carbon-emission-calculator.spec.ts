import { CarbonEmissionCalculator } from '../../src/carbon-tracker/business/carbon-emission-calculator';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';
import { EMISSION_FACTORS } from '../../src/carbon-tracker/constants/emission-factors.constant';
import {
  InvalidVehicleTypeException,
  InvalidCargoWeightException,
  InvalidDistanceException,
  InvalidEfficiencyFactorException,
} from '../../src/carbon-tracker/exceptions/carbon-tracker.exceptions';

describe('CarbonEmissionCalculator', () => {
  // ---------------------------------------------------------------------
  // Casos felices (happy path) — uno por tipo de vehículo
  // ---------------------------------------------------------------------
  describe('cálculo correcto (happy path)', () => {
    it('calcula correctamente para DIESEL', () => {
      const result = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      });
      // 100km * 10t * 0.162 * 1 = 162 kg
      expect(result.co2EmissionsKg).toBe(162);
      expect(result.co2EmissionsTons).toBe(0.16);
      expect(result.baseFactorUsed).toBe(0.162);
    });

    it('calcula correctamente para ELECTRICO', () => {
      const result = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.ELECTRICO,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      });
      expect(result.co2EmissionsKg).toBe(20); // 100*10*0.02
    });

    it('calcula correctamente para HIBRIDO', () => {
      const result = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.HIBRIDO,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      });
      expect(result.co2EmissionsKg).toBe(90); // 100*10*0.09
    });

    it('un vehículo eléctrico siempre emite menos que uno diésel en igualdad de condiciones', () => {
      const base = { cargoWeightTons: 10, distanceKm: 100, efficiencyFactor: 1 };
      const electric = CarbonEmissionCalculator.calculate({ ...base, vehicleType: VehicleType.ELECTRICO });
      const diesel = CarbonEmissionCalculator.calculate({ ...base, vehicleType: VehicleType.DIESEL });
      expect(electric.co2EmissionsKg).toBeLessThan(diesel.co2EmissionsKg);
    });

    it('el factor de eficiencia escala linealmente el resultado', () => {
      const normal = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.HIBRIDO, cargoWeightTons: 5, distanceKm: 50, efficiencyFactor: 1,
      });
      const doubled = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.HIBRIDO, cargoWeightTons: 5, distanceKm: 50, efficiencyFactor: 2,
      });
      expect(doubled.co2EmissionsKg).toBe(normal.co2EmissionsKg * 2);
    });

    it('calcula correctamente el número de árboles equivalentes (redondeado hacia arriba)', () => {
      const result = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.DIESEL, cargoWeightTons: 10, distanceKm: 100, efficiencyFactor: 1,
      });
      // 162 kg / 21 kg-por-árbol = 7.71... -> ceil = 8
      expect(result.equivalentTreesToOffset).toBe(8);
    });

    it('redondea el resultado a 2 decimales', () => {
      const result = CarbonEmissionCalculator.calculate({
        vehicleType: VehicleType.ELECTRICO, cargoWeightTons: 3, distanceKm: 7, efficiencyFactor: 1.3333,
      });
      const decimals = result.co2EmissionsKg.toString().split('.')[1] ?? '';
      expect(decimals.length).toBeLessThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------
  // Casos de borde: cargoWeightTons
  // ---------------------------------------------------------------------
  describe('casos de borde — cargoWeightTons', () => {
    it.each([
      ['0 (cero exacto)', 0],
      ['negativo', -5],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['-Infinity', -Infinity],
      ['por debajo del mínimo (0.0001)', 0.0001],
      ['por encima del máximo (60.01t)', 60.01],
      ['muy por encima del máximo (999t)', 999],
      ['string numérico en vez de number', '10' as unknown as number],
      ['null', null as unknown as number],
      ['undefined', undefined as unknown as number],
    ])('rechaza peso de carga inválido: %s', (_desc, value) => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL,
          cargoWeightTons: value,
          distanceKm: 100,
          efficiencyFactor: 1,
        }),
      ).toThrow(InvalidCargoWeightException);
    });

    it('acepta el límite inferior exacto (0.001t)', () => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 0.001, distanceKm: 100, efficiencyFactor: 1,
        }),
      ).not.toThrow();
    });

    it('acepta el límite superior exacto (60t)', () => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 60, distanceKm: 100, efficiencyFactor: 1,
        }),
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // Casos de borde: distanceKm
  // ---------------------------------------------------------------------
  describe('casos de borde — distanceKm', () => {
    it.each([
      ['0 (cero exacto)', 0],
      ['negativa', -100],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['por encima del máximo (20000.01 km)', 20000.01],
      ['string en vez de number', '100' as unknown as number],
      ['null', null as unknown as number],
    ])('rechaza distancia inválida: %s', (_desc, value) => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL,
          cargoWeightTons: 10,
          distanceKm: value,
          efficiencyFactor: 1,
        }),
      ).toThrow(InvalidDistanceException);
    });

    it('acepta el límite superior exacto (20000 km)', () => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 1, distanceKm: 20000, efficiencyFactor: 1,
        }),
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // Casos de borde: efficiencyFactor
  // ---------------------------------------------------------------------
  describe('casos de borde — efficiencyFactor', () => {
    it.each([
      ['0 (cero exacto)', 0],
      ['negativo', -1],
      ['NaN', NaN],
      ['por encima del máximo (5.01)', 5.01],
      ['muy por encima del máximo (10)', 10],
    ])('rechaza factor de eficiencia inválido: %s', (_desc, value) => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL,
          cargoWeightTons: 10,
          distanceKm: 100,
          efficiencyFactor: value,
        }),
      ).toThrow(InvalidEfficiencyFactorException);
    });

    it('acepta el límite superior exacto (5)', () => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 1, distanceKm: 1, efficiencyFactor: 5,
        }),
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // Casos de borde: vehicleType no soportado
  // ---------------------------------------------------------------------
  describe('casos de borde — vehicleType', () => {
    it.each([
      ['tipo de string no soportado', 'GASOLINA'],
      ['undefined', undefined],
      ['null', null],
      ['número en vez de string', 123],
      ['string vacío', ''],
      ['case-sensitive incorrecto', 'diesel'],
    ])('rechaza vehicleType inválido: %s', (_desc, value) => {
      expect(() =>
        CarbonEmissionCalculator.calculate({
          vehicleType: value as unknown as VehicleType,
          cargoWeightTons: 10,
          distanceKm: 100,
          efficiencyFactor: 1,
        }),
      ).toThrow(InvalidVehicleTypeException);
    });

    it('el mensaje de error lista los tipos soportados', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: 'GASOLINA' as unknown as VehicleType,
          cargoWeightTons: 10, distanceKm: 100, efficiencyFactor: 1,
        });
        fail('debía lanzar InvalidVehicleTypeException');
      } catch (error) {
        expect((error as Error).message).toContain('ELECTRICO');
        expect((error as Error).message).toContain('DIESEL');
        expect((error as Error).message).toContain('HIBRIDO');
      }
    });
  });

  // ---------------------------------------------------------------------
  // Trazabilidad de errores (code estable por excepción)
  // ---------------------------------------------------------------------
  describe('trazabilidad de errores', () => {
    it('InvalidCargoWeightException expone code=INVALID_CARGO_WEIGHT', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: -1, distanceKm: 10, efficiencyFactor: 1,
        });
        fail('debía lanzar una excepción');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCargoWeightException);
        expect((error as InvalidCargoWeightException).code).toBe('INVALID_CARGO_WEIGHT');
      }
    });

    it('InvalidDistanceException expone code=INVALID_DISTANCE', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 1, distanceKm: -1, efficiencyFactor: 1,
        });
        fail('debía lanzar una excepción');
      } catch (error) {
        expect((error as InvalidDistanceException).code).toBe('INVALID_DISTANCE');
      }
    });

    it('InvalidEfficiencyFactorException expone code=INVALID_EFFICIENCY_FACTOR', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: 1, distanceKm: 1, efficiencyFactor: -1,
        });
        fail('debía lanzar una excepción');
      } catch (error) {
        expect((error as InvalidEfficiencyFactorException).code).toBe('INVALID_EFFICIENCY_FACTOR');
      }
    });

    it('InvalidVehicleTypeException expone code=INVALID_VEHICLE_TYPE', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: 'X' as unknown as VehicleType, cargoWeightTons: 1, distanceKm: 1, efficiencyFactor: 1,
        });
        fail('debía lanzar una excepción');
      } catch (error) {
        expect((error as InvalidVehicleTypeException).code).toBe('INVALID_VEHICLE_TYPE');
      }
    });

    it('cinturón de seguridad: lanza InvalidCargoWeightException si el resultado no fuera finito', () => {
      // Simula una regresión futura en la tabla de factores (ej. un valor
      // corrupto) para verificar que el "cinturón de seguridad" del cálculo
      // nunca deja pasar un NaN/Infinity silencioso hacia el cliente de la API.
      const originalFactor = EMISSION_FACTORS[VehicleType.DIESEL].baseFactorKgCo2PerTonKm;
      EMISSION_FACTORS[VehicleType.DIESEL].baseFactorKgCo2PerTonKm = Infinity;

      try {
        expect(() =>
          CarbonEmissionCalculator.calculate({
            vehicleType: VehicleType.DIESEL,
            cargoWeightTons: 10,
            distanceKm: 100,
            efficiencyFactor: 1,
          }),
        ).toThrow(InvalidCargoWeightException);
      } finally {
        EMISSION_FACTORS[VehicleType.DIESEL].baseFactorKgCo2PerTonKm = originalFactor;
      }
    });

    it('todas las excepciones de dominio son instancias de Error', () => {
      try {
        CarbonEmissionCalculator.calculate({
          vehicleType: VehicleType.DIESEL, cargoWeightTons: -1, distanceKm: 1, efficiencyFactor: 1,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
