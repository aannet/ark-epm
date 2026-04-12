import { IsOptional, IsUUID, IsEnum, IsString } from 'class-validator';
import { InterfaceType, CriticalityLevel } from '@prisma/client';

export class QueryInterfaceDto {
  @IsOptional()
  @IsUUID()
  sourceAppId?: string;

  @IsOptional()
  @IsUUID()
  targetAppId?: string;

  @IsOptional()
  @IsUUID()
  middlewareAppId?: string;

  @IsOptional()
  @IsEnum(InterfaceType)
  type?: InterfaceType;

  @IsOptional()
  @IsEnum(CriticalityLevel)
  criticality?: CriticalityLevel;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
