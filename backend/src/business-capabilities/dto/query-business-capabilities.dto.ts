import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';

export class QueryBusinessCapabilitiesDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsEnum(['name', 'createdAt', 'level'])
  @IsOptional()
  sortBy?: string = 'name';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'asc';

  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;
}
