import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsEnum, IsString } from 'class-validator';

export class QueryDomainsDto {
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

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['name', 'description', 'createdAt'])
  @IsOptional()
  sortBy?: string = 'name';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'asc';
}
