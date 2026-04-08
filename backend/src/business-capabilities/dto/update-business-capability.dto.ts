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

export class UpdateBusinessCapabilityDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name?: string;

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
  parentId?: string | null;

  @IsUUID()
  @IsOptional()
  domainId?: string | null;

  @IsEnum(CriticalityLevel)
  @IsOptional()
  criticality?: CriticalityLevel | null;

  @IsEnum(TechnicalFitLevel)
  @IsOptional()
  technicalFit?: TechnicalFitLevel | null;
}
