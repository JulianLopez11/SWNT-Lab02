import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  Max,
} from 'class-validator';
import { VehicleType } from '../domain/enums/vehicle-type.enum';

export class CalculateEmissionDto {
  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.DIESEL,
    description: 'Tipo de vehículo utilizado para el transporte',
  })
  @IsEnum(VehicleType, {
    message: `vehicleType debe ser uno de: ${Object.values(VehicleType).join(', ')}`,
  })
  vehicleType: VehicleType;

  @ApiProperty({
    example: 12.5,
    description: 'Peso de la carga transportada, en toneladas',
  })
  @IsNumber({}, { message: 'cargoWeightTons debe ser un número' })
  @IsPositive({ message: 'cargoWeightTons debe ser mayor a 0' })
  cargoWeightTons: number;

  @ApiProperty({
    example: 340,
    description: 'Distancia recorrida, en kilómetros',
  })
  @IsNumber({}, { message: 'distanceKm debe ser un número' })
  @IsPositive({ message: 'distanceKm debe ser mayor a 0' })
  distanceKm: number;

  @ApiProperty({
    example: 1.0,
    default: 1.0,
    description:
      'Factor de eficiencia del vehículo (1.0 = estándar, <1 más eficiente, >1 menos eficiente)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'efficiencyFactor debe ser un número' })
  @IsPositive({ message: 'efficiencyFactor debe ser mayor a 0' })
  @Max(5, { message: 'efficiencyFactor no debe superar 5' })
  efficiencyFactor?: number = 1.0;
}
