import {
  IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID,
  IsEnum, IsArray, ValidateNested, ArrayMinSize, Matches, NotContains,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProviderMappingDto } from './provider-mapping.dto';
import { ItComponentMappingDto } from './it-component-mapping.dto';

export class CreateApplicationDto {
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
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  comment?: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ProviderMappingDto)
  providers?: ProviderMappingDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ItComponentMappingDto)
  itComponents?: ItComponentMappingDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('4', { each: true })
  capabilityIds?: string[];

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsEnum(['low', 'medium', 'high', 'mission-critical'])
  @IsOptional()
  criticality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lifecycleStatus?: string;
}
