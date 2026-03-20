import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  IsEnum,
  IsString,
} from 'class-validator';

export class QueryItComponentsDto {
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

  @IsEnum(['name', 'createdAt', 'type', 'technology'])
  @IsOptional()
  sortBy?: string = 'name';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'asc';

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  technology?: string;
}
