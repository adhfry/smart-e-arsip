import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username untuk login',
    example: 'ahda.admin',
    minLength: 3,
  })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString()
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  username: string;

  @ApiProperty({
    description: 'Password user',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}
