import { IsEnum, IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum FocalType {
  APPLICATION         = 'application',
  BUSINESS_CAPABILITY = 'business_capability',
  DOMAIN              = 'domain',
  PROVIDER            = 'provider',
  IT_COMPONENT        = 'it_component',
  DATA_OBJECT         = 'data_object',
}

export enum GraphLayer {
  APPLICATIONS          = 'applications',
  INTERFACES            = 'interfaces',
  BUSINESS_CAPABILITIES = 'business_capabilities',
  PROVIDERS             = 'providers',
  IT_COMPONENTS         = 'it_components',
  DATA_OBJECTS          = 'data_objects',
}

export class QueryGraphDto {
  @IsEnum(FocalType)
  focalType: FocalType;

  @IsUUID()
  focalId: string;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  @Type(() => Number)
  depth?: number;

  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })
  @IsEnum(GraphLayer, { each: true })
  @IsOptional()
  layers?: GraphLayer[];
}
