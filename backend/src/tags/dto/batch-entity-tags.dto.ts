import { IsArray, IsUUID } from 'class-validator';

export class BatchEntityTagsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tagValueIds: string[];
}
