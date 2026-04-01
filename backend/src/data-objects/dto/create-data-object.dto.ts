import { IsString, IsNotEmpty, IsOptional, MaxLength, Transform, IsBoolean } from 'class-validator';

export class CreateDataObjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsBoolean()
  isSourceOfTruth?: boolean;
}
