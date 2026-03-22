import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProviderMappingDto } from './provider-mapping.dto';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
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

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsEnum(['low', 'medium', 'high', 'mission-critical'])
  @IsOptional()
  criticality?: string;

  @IsString()
  @IsOptional()
  lifecycleStatus?: string;
}
