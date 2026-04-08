import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CriticalityLevel, TechnicalFitLevel } from '@prisma/client';

export class CreateBusinessCapabilityDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(2000)
  comment?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;

  @IsEnum(CriticalityLevel)
  @IsOptional()
  criticality?: CriticalityLevel;

  @IsEnum(TechnicalFitLevel)
  @IsOptional()
  technicalFit?: TechnicalFitLevel;
}
