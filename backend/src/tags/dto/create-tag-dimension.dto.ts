import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, MaxLength, Matches, NotContains } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTagDimensionDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'Name contains forbidden characters (injection attempt)' })
  @NotContains('://', { message: 'Name cannot contain URL schemes' })
  name: string;

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

  @IsBoolean()
  @IsOptional()
  multiValue?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  entityScope?: string[];
}
