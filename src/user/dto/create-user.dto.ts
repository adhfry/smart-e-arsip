import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nama lengkap user',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  nama_lengkap: string;

  @ApiProperty({
    description: 'Username untuk login',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
  })
  username: string;

  @ApiProperty({
    description: 'Email user (opsional)',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Nomor telepon (opsional)',
    example: '081234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'Format nomor telepon tidak valid',
  })
  phone?: string;

  @ApiProperty({
    description: 'Password user',
    example: 'StrongP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  password: string;

  @ApiProperty({
    description: 'Role user dalam sistem',
    enum: Role,
    example: Role.staf_tu,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'Status aktif user',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
