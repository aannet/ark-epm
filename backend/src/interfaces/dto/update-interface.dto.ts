import { OmitType } from '@nestjs/mapped-types';
import { IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { CreateInterfaceDto } from './create-interface.dto';

// Base DTO without middlewareAppId to allow redefinition with null support
class UpdateInterfaceDtoBase extends OmitType(CreateInterfaceDto, ['middlewareAppId'] as const) {}

export class UpdateInterfaceDto extends UpdateInterfaceDtoBase {
  // Override to allow explicit null for unsetting middleware
  @IsOptional()
  @ValidateIf((o) => o.middlewareAppId !== null)
  @IsUUID()
  middlewareAppId?: string | null;
}
