import { VehicleType } from '../domain/enums/vehicle-type.enum';
import { EmissionFactor } from '../domain/interfaces/emission-factor.interface';

/**
 * Factores base de emisión (kg CO2 / tonelada·km).
 * Valores de referencia inspirados en el framework GLEC / EPA SmartWay.
 * Se recomienda parametrizar esto vía configuración/BD en producción,
 * ya que varían según región, mezcla energética y flota real.
 */
export const EMISSION_FACTORS: Record<VehicleType, EmissionFactor> = {
  [VehicleType.ELECTRICO]: {
    vehicleType: VehicleType.ELECTRICO,
    baseFactorKgCo2PerTonKm: 0.02,
    description:
      'Vehículo eléctrico. Emisión indirecta según matriz energética.',
  },
  [VehicleType.HIBRIDO]: {
    vehicleType: VehicleType.HIBRIDO,
    baseFactorKgCo2PerTonKm: 0.09,
    description: 'Vehículo híbrido. Combina combustión y energía eléctrica.',
  },
  [VehicleType.DIESEL]: {
    vehicleType: VehicleType.DIESEL,
    baseFactorKgCo2PerTonKm: 0.162,
    description: 'Vehículo diésel convencional.',
  },
};
