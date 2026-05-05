import {
  IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsEnum, Matches, NotContains,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CriticalityLevel, TechnicalFitLevel } from '@prisma/client';

export class UpdateBusinessCapabilityDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'Name contains forbidden characters (injection attempt)' })
  @NotContains('://', { message: 'Name cannot contain URL schemes' })
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
