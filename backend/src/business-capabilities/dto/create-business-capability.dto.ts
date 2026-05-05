import {
  IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsEnum, Matches, NotContains,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CriticalityLevel, TechnicalFitLevel } from '@prisma/client';

export class CreateBusinessCapabilityDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'Name contains forbidden characters (injection attempt)' })
  @NotContains('://', { message: 'Name cannot contain URL schemes' })
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
