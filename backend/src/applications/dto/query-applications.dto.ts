import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  IsEnum,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';

export class QueryApplicationsDto {
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

  @IsEnum(['name', 'createdAt', 'domain', 'provider', 'criticality', 'lifecycleStatus'])
  @IsOptional()
  sortBy?: string = 'name';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'asc';

  @IsString()
  @IsOptional()
  lifecycleStatus?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tagValueIds?: string[];
}
