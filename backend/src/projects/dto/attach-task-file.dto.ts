import { IsString } from 'class-validator';

export class AttachTaskFileDto {
  @IsString()
  uploadId!: string;
}
