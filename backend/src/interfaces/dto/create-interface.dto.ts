import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, Min, Max, IsArray, MaxLength, Matches, NotContains } from 'class-validator';
import { Transform } from 'class-transformer';
import { InterfaceType, InterfaceFrequency, CriticalityLevel } from '@prisma/client';

export class CreateInterfaceDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'Name contains forbidden characters (injection attempt)' })
  @NotContains('://', { message: 'Name cannot contain URL schemes' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
  @MaxLength(255)
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'technicalContact contains forbidden characters' })
  @NotContains('://', { message: 'technicalContact cannot contain URL schemes' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
