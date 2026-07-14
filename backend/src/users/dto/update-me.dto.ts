import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['fr', 'en'])
  @MaxLength(10)
  language: string;
}
