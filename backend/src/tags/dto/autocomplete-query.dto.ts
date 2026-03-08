import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class AutocompleteQueryDto {
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        throw new Error('Parameter dimension must be a single string value');
      }
      if (typeof value === 'string') {
        return value.trim();
      }
      throw new Error('Parameter dimension must be a string');
    },
    { toClassOnly: true },
  )
  @IsString()
  dimension: string;

  @IsOptional()
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        return undefined;
      }
      if (typeof value === 'string') {
        return value.trim() || undefined;
      }
      return undefined;
    },
    { toClassOnly: true },
  )
  @IsString()
  query?: string;

  @IsOptional()
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        return undefined;
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          return undefined;
        }
        return parsed;
      }
      return value;
    },
    { toClassOnly: true },
  )
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
