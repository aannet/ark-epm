import {
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateItComponentDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  technology?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  type?: string;
}
