import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, Min, IsEnum, IsString } from 'class-validator';

export class QueryProvidersDto {
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

  @IsEnum(['name', 'createdAt', 'expiryDate'])
  @IsOptional()
  sortBy?: string = 'name';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'asc';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
