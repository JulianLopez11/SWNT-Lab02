import { Test, TestingModule } from '@nestjs/testing';
import { CarbonTrackerController } from '../../src/carbon-tracker/carbon-tracker.controller';
import { CarbonTrackerService } from '../../src/carbon-tracker/carbon-tracker.service';
import { VehicleType } from '../../src/carbon-tracker/domain/enums/vehicle-type.enum';
import { EmissionResponseDto } from '../../src/carbon-tracker/dto/emission-response.dto';
import { CalculateEmissionDto } from '../../src/carbon-tracker/dto/calculate-emission.dto';

describe('CarbonTrackerController', () => {
  let controller: CarbonTrackerController;
  let service: jest.Mocked<CarbonTrackerService>;

  beforeEach(async () => {
    // Mock del Service inyectado: el Controller se testea en total aislamiento
    // de la lógica de negocio real (principio de responsabilidad única).
    const mockService = {
      calculateEmission: jest.fn(),
      getEmissionFactors: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbonTrackerController],
      providers: [{ provide: CarbonTrackerService, useValue: mockService }],
    }).compile();

    controller = module.get<CarbonTrackerController>(CarbonTrackerController);
    service = module.get(CarbonTrackerService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /carbon-tracker/calculate', () => {
    it('delega al service.calculateEmission y devuelve su resultado sin modificarlo', () => {
      const dto: CalculateEmissionDto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: 10,
        distanceKm: 100,
        efficiencyFactor: 1,
      };
      const expected = { co2EmissionsKg: 162 } as EmissionResponseDto;
      service.calculateEmission.mockReturnValue(expected);

      const result = controller.calculate(dto);

      expect(service.calculateEmission).toHaveBeenCalledWith(dto);
      expect(service.calculateEmission).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });

    it('no atrapa errores: si el service lanza, el controller propaga (lo maneja el filter)', () => {
      const dto: CalculateEmissionDto = {
        vehicleType: VehicleType.DIESEL,
        cargoWeightTons: -1,
        distanceKm: 100,
        efficiencyFactor: 1,
      };
      service.calculateEmission.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => controller.calculate(dto)).toThrow('boom');
    });
  });

  describe('GET /carbon-tracker/factors', () => {
    it('delega al service.getEmissionFactors y devuelve su resultado', () => {
      const expected = [{ vehicleType: VehicleType.DIESEL }] as any;
      service.getEmissionFactors.mockReturnValue(expected);

      const result = controller.getFactors();

      expect(service.getEmissionFactors).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });
});
