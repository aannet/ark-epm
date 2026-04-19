import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  IsEnum,
  ArrayUnique,
} from 'class-validator';

export enum SearchableEntityType {
  APPLICATION = 'application',
  DOMAIN = 'domain',
  BUSINESS_CAPABILITY = 'businessCapability',
  PROVIDER = 'provider',
  IT_COMPONENT = 'itComponent',
  DATA_OBJECT = 'dataObject',
  INTERFACE = 'interface',
}

export class QuerySearchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SearchableEntityType, { each: true })
  @ArrayUnique()
  @Transform(({ value }) => {
    // Handle both single value and array from query params
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  })
  types?: SearchableEntityType[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}
