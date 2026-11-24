import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StartDropDto {
  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  collectionName?: string;
}
