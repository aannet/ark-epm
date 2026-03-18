import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;

  @IsUUID()
  @IsOptional()
  providerId?: string;

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
