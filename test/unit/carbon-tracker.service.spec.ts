import { Test, TestingModule } from '@nestjs/testing';
import { CarbonTrackerService } from '../../src/carbon-tracker/carbon-tracker.service';
import { CarbonEmissionCalculator } from '../../src/carbon-tracker/business/carbon-emission-calculator';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';
import { InvalidCargoWeightException } from '../../src/carbon-tracker/exceptions/carbon-tracker.exceptions';
import { CalculateEmissionDto } from '../../src/carbon-tracker/dto/calculate-emission.dto';

describe('CarbonTrackerService', () => {
  let service: CarbonTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonTrackerService],
    }).compile();

    service = module.get<CarbonTrackerService>(CarbonTrackerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateEmission', () => {
    it('delega el cálculo a CarbonEmissionCalculator con los datos del DTO', () => {
      const calculateSpy = jest.spyOn(CarbonEmissionCalculator, 'calculate');
      const dto: CalculateEmissionDto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      };

      service.calculateEmission(dto);

      expect(calculateSpy).toHaveBeenCalledWith({
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      });
    });

    it('aplica efficiencyFactor=1 por defecto cuando no se envía', () => {
      const calculateSpy = jest.spyOn(CarbonEmissionCalculator, 'calculate');
      const dto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
      } as CalculateEmissionDto;

      service.calculateEmission(dto);

      expect(calculateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ efficiencyFactor: 1 }),
      );
    });

    it('mapea el resultado del cálculo a un EmissionResponseDto completo', () => {
      const dto: CalculateEmissionDto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      };

      const response = service.calculateEmission(dto);

      expect(response.vehicleType).toBe(VehicleType.DIESEL);
      expect(response.cargoWeightTons).toBe(10);
      expect(response.distanceKm).toBe(100);
      expect(response.co2EmissionsKg).toBe(162);
      expect(response.calculatedAt).toBeDefined();
      expect(new Date(response.calculatedAt).toString()).not.toBe('Invalid Date');
    });

    it('no atrapa la excepción de dominio: la deja subir tal cual (sin acoplar HTTP)', () => {
      const dto: CalculateEmissionDto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: -5,
        distanceKm: 100,
        efficiencyFactor: 1,
      };

      expect(() => service.calculateEmission(dto)).toThrow(InvalidCargoWeightException);
    });
  });

  describe('getEmissionFactors', () => {
    it('devuelve los 3 factores base de emisión configurados', () => {
      const factors = service.getEmissionFactors();

      expect(factors).toHaveLength(3);
      expect(factors.map((f) => f.vehicleType).sort()).toEqual(
        [VehicleType.DIESEL, VehicleType.ELECTRICO, VehicleType.HIBRIDO].sort(),
      );
    });

    it('cada factor incluye baseFactorKgCo2PerTonKm y description', () => {
      const factors = service.getEmissionFactors();

      factors.forEach((factor) => {
        expect(typeof factor.baseFactorKgCo2PerTonKm).toBe('number');
        expect(factor.baseFactorKgCo2PerTonKm).toBeGreaterThan(0);
        expect(typeof factor.description).toBe('string');
        expect(factor.description.length).toBeGreaterThan(0);
      });
    });
  });
});
