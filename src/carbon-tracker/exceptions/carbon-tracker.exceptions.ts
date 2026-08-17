/**
 * Excepción base de dominio. NUNCA depende de Nest/HTTP: así esta capa
 * se puede reutilizar en un job batch, un consumer de cola, un CLI, etc.
 * Cada subclase tiene un `code` estable para logging/monitoreo y para que
 * el consumidor de la API pueda reaccionar programáticamente sin parsear texto.
 */
export abstract class CarbonTrackerDomainException extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidVehicleTypeException extends CarbonTrackerDomainException {
  readonly code = 'INVALID_VEHICLE_TYPE';
  constructor(received: unknown, supported: string[]) {
    super(
      `Tipo de vehículo no soportado: "${String(received)}". Valores permitidos: ${supported.join(', ')}.`,
    );
  }
}

export class InvalidCargoWeightException extends CarbonTrackerDomainException {
  readonly code = 'INVALID_CARGO_WEIGHT';
  constructor(received: unknown, min: number, max: number) {
    super(
      `El peso de la carga (${String(received)}) debe ser un número finito entre ${min} y ${max} toneladas.`,
    );
  }
}

export class InvalidDistanceException extends CarbonTrackerDomainException {
  readonly code = 'INVALID_DISTANCE';
  constructor(received: unknown, min: number, max: number) {
    super(
      `La distancia (${String(received)}) debe ser un número finito entre ${min} y ${max} km.`,
    );
  }
}

export class InvalidEfficiencyFactorException extends CarbonTrackerDomainException {
  readonly code = 'INVALID_EFFICIENCY_FACTOR';
  constructor(received: unknown, min: number, max: number) {
    super(
      `El factor de eficiencia (${String(received)}) debe ser un número finito entre ${min} y ${max}.`,
    );
  }
}
