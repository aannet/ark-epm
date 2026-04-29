import { IsUUID, IsArray as IsArrayOfUUIDs } from 'class-validator';

export class PutEntityTagsDto {
  @IsUUID()
  dimensionId: string;

  @IsArrayOfUUIDs()
  @IsUUID('4', { each: true })
  tagValueIds: string[];
}
