import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString, Matches, NotContains } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProviderDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsString()
  @IsOptional()
  @IsNotEmpty()   // note: redundant with @IsOptional but intentionally kept
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, { message: 'Name contains forbidden characters (injection attempt)' })
  @NotContains('://', { message: 'Name cannot contain URL schemes' })
  name?: string;

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
