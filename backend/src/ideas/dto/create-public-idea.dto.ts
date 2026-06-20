import { IsBoolean, IsEmail, IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { IdeaProjectStage, IdeaProjectType } from '@prisma/client';

export class CreatePublicIdeaDto {
  // Datos del solicitante
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  proponentName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  position!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  phone!: string;

  @IsUUID()
  unitId!: string;

  // Información del proyecto
  @IsEnum(IdeaProjectType)
  projectType!: IdeaProjectType;

  @IsEnum(IdeaProjectStage)
  projectStage!: IdeaProjectStage;

  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @IsBoolean()
  jefaturaApproval!: boolean;

  // Ficha técnica obligatoria: id devuelto por POST /public/ideas/upload-ficha
  @IsUUID()
  fichaUploadId!: string;
}
