import { IsString, IsUUID, IsArray, IsArray as IsArrayOfUUIDs, ValidateIf } from 'class-validator';

export class PutEntityTagsDto {
  @IsUUID()
  dimensionId: string;

  @IsArrayOfUUIDs()
  @IsUUID('4', { each: true })
  tagValueIds: string[];
}
