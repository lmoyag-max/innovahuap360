import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateEventRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsString()
  @Matches(/^\d{7,8}-[\dkK]$/, { message: 'RUT inválido (formato esperado: 12345678-9)' })
  rut!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  unit!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  position!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observation?: string;
}
