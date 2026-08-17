import { VehicleType } from '../enums/vehicle-type.enum';

/**
 * Representa el factor base de emisión de un tipo de vehículo,
 * expresado en kg de CO2 por tonelada-kilómetro (kg CO2 / t·km).
 */
export interface EmissionFactor {
  vehicleType: VehicleType;
  baseFactorKgCo2PerTonKm: number;
  description: string;
}
