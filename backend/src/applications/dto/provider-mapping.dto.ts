import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ProviderMappingDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  role?: string;
}
