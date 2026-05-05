import { IsString, IsOptional, MaxLength, Matches, NotContains } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDomainDto {
  // AGENT-DECISION: back — T-101 injection hardening
  @IsString()
  @IsOptional()
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
}
