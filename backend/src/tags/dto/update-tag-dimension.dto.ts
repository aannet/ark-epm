import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTagDimensionDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;
}
