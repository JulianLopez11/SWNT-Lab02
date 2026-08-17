import { VehicleType } from '../domain/enums/vehicle-type.enum';
import { EMISSION_FACTORS } from '../constants/emission-factors.constant';
import {
  InvalidVehicleTypeException,
  InvalidCargoWeightException,
  InvalidDistanceException,
  InvalidEfficiencyFactorException,
} from '../exceptions/carbon-tracker.exceptions';

export interface CarbonEmissionInput {
  vehicleType: VehicleType;
  cargoWeightTons: number;
  distanceKm: number;
  efficiencyFactor: number;
}

export interface CarbonEmissionResult {
  co2EmissionsKg: number;
  co2EmissionsTons: number;
  baseFactorUsed: number;
  equivalentTreesToOffset: number;
}

/**
 * LÓGICA DE NEGOCIO — completamente separada de la capa HTTP.
 * No importa nada de @nestjs/common, no conoce DTOs de Nest, no conoce
 * status codes. Solo sabe calcular y validar. Esto permite:
 *  - Testearla sin levantar el framework.
 *  - Reutilizarla en un worker, un cron, un consumer de RabbitMQ, etc.
 *  - Que un cambio en el transporte (REST -> gRPC) no la toque.
 */
export class CarbonEmissionCalculator {
  // Límites de negocio (no solo ">0"): valores fuera de estos rangos son
  // físicamente absurdos para un camión de carga real y probablemente
  // indican un error de captura de datos (ej. kg en vez de toneladas).
  private static readonly MIN_CARGO_WEIGHT_TONS = 0.001;
  private static readonly MAX_CARGO_WEIGHT_TONS = 60; // límite típico de un camión articulado
  private static readonly MIN_DISTANCE_KM = 0.001;
  private static readonly MAX_DISTANCE_KM = 20000; // más que la distancia máxima terrestre razonable
  private static readonly MIN_EFFICIENCY_FACTOR = 0.01;
  private static readonly MAX_EFFICIENCY_FACTOR = 5;
  private static readonly KG_CO2_ABSORBED_PER_TREE_PER_YEAR = 21;

  /**
   * Función principal de cálculo de huella de carbono.
   * Lanza una excepción de dominio específica y tipada ante cualquier
   * entrada inválida — nunca devuelve NaN/Infinity silenciosamente.
   */
  static calculate(input: CarbonEmissionInput): CarbonEmissionResult {
    this.assertValidVehicleType(input.vehicleType);
    this.assertValidCargoWeight(input.cargoWeightTons);
    this.assertValidDistance(input.distanceKm);
    this.assertValidEfficiencyFactor(input.efficiencyFactor);

    const baseFactorUsed =
      EMISSION_FACTORS[input.vehicleType].baseFactorKgCo2PerTonKm;

    const co2EmissionsKg =
      input.distanceKm *
      input.cargoWeightTons *
      baseFactorUsed *
      input.efficiencyFactor;

    // Cinturón de seguridad: si por alguna razón el resultado no es un
    // número finito (ej. futura regresión en los factores), fallamos
    // explícitamente en vez de propagar NaN al cliente de la API.
    if (!Number.isFinite(co2EmissionsKg)) {
      throw new InvalidCargoWeightException(
        input.cargoWeightTons,
        this.MIN_CARGO_WEIGHT_TONS,
        this.MAX_CARGO_WEIGHT_TONS,
      );
    }

    return {
      co2EmissionsKg: this.round(co2EmissionsKg),
      co2EmissionsTons: this.round(co2EmissionsKg / 1000),
      baseFactorUsed,
      equivalentTreesToOffset: Math.ceil(
        co2EmissionsKg / this.KG_CO2_ABSORBED_PER_TREE_PER_YEAR,
      ),
    };
  }

  private static assertValidVehicleType(
    vehicleType: unknown,
  ): asserts vehicleType is VehicleType {
    const isSupported =
      typeof vehicleType === 'string' &&
      Object.prototype.hasOwnProperty.call(EMISSION_FACTORS, vehicleType);

    if (!isSupported) {
      throw new InvalidVehicleTypeException(
        vehicleType,
        Object.values(VehicleType),
      );
    }
  }

  private static assertValidCargoWeight(cargoWeightTons: unknown): void {
    if (
      typeof cargoWeightTons !== 'number' ||
      !Number.isFinite(cargoWeightTons) ||
      cargoWeightTons < this.MIN_CARGO_WEIGHT_TONS ||
      cargoWeightTons > this.MAX_CARGO_WEIGHT_TONS
    ) {
      throw new InvalidCargoWeightException(
        cargoWeightTons,
        this.MIN_CARGO_WEIGHT_TONS,
        this.MAX_CARGO_WEIGHT_TONS,
      );
    }
  }

  private static assertValidDistance(distanceKm: unknown): void {
    if (
      typeof distanceKm !== 'number' ||
      !Number.isFinite(distanceKm) ||
      distanceKm < this.MIN_DISTANCE_KM ||
      distanceKm > this.MAX_DISTANCE_KM
    ) {
      throw new InvalidDistanceException(
        distanceKm,
        this.MIN_DISTANCE_KM,
        this.MAX_DISTANCE_KM,
      );
    }
  }

  private static assertValidEfficiencyFactor(efficiencyFactor: unknown): void {
    if (
      typeof efficiencyFactor !== 'number' ||
      !Number.isFinite(efficiencyFactor) ||
      efficiencyFactor < this.MIN_EFFICIENCY_FACTOR ||
      efficiencyFactor > this.MAX_EFFICIENCY_FACTOR
    ) {
      throw new InvalidEfficiencyFactorException(
        efficiencyFactor,
        this.MIN_EFFICIENCY_FACTOR,
        this.MAX_EFFICIENCY_FACTOR,
      );
    }
  }

  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
