import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, Min, Max, IsArray, ValidateIf } from 'class-validator';
import { InterfaceType, InterfaceFrequency, CriticalityLevel } from '@prisma/client';

export class CreateInterfaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsUUID()
  sourceAppId: string;

  @IsUUID()
  targetAppId: string;

  @IsOptional()
  @IsUUID()
  middlewareAppId?: string;

  @IsEnum(InterfaceType)
  type: InterfaceType;

  @IsOptional()
  @IsEnum(InterfaceFrequency)
  frequency?: InterfaceFrequency;

  @IsOptional()
  @IsEnum(CriticalityLevel)
  criticality?: CriticalityLevel;

  @IsOptional()
  @IsString()
  technicalContact?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  errorRate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagPaths?: string[];
}
