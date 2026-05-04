import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean, Matches, NotContains } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDataObjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  // AGENT-DECISION: back — T-099 ZAP injection fix
  // Reject shell injection characters and common attack vectors
  @Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, {
    message: 'Name contains forbidden characters (injection attempt)',
  })
  // Reject URL schemes that could indicate phishing or external exfiltration
  @NotContains('://', {
    message: 'Name cannot contain URL schemes',
  })
  @Transform(({ value }: { value: any }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  // Trim whitespace and apply same injection filter as name (permissive for long-text fields)
  @Transform(({ value }: { value: any }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: any }) => (typeof value === 'string' ? value.trim() : value))
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsBoolean()
  isSourceOfTruth?: boolean;
}
