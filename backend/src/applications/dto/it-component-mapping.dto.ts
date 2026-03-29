import { IsUUID } from 'class-validator';

export class ItComponentMappingDto {
  @IsUUID()
  id: string;
}
