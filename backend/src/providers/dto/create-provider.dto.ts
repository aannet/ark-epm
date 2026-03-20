import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(2000)
  comment?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contractType?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
