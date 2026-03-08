import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ResolveTagDto {
  @IsUUID()
  dimensionId: string;

  @IsString()
  path: string;

  @IsString()
  @IsOptional()
  label?: string;
}
