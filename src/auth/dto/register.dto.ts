import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'Nama lengkap user',
    example: 'Ahmad Suryadi',
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  @IsString()
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
  nama_lengkap: string;

  @ApiProperty({
    description: 'Username untuk login (unique)',
    example: 'ahmad.user',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString()
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(50, { message: 'Username maksimal 50 karakter' })
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Username hanya boleh huruf kecil, angka, titik, underscore, dan dash',
  })
  username: string;

  @ApiProperty({
    description: 'Email user (optional, unique)',
    example: 'ahmad@smartearsip.id',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(100, { message: 'Email maksimal 100 karakter' })
  email?: string;

  @ApiProperty({
    description: 'Nomor telepon (optional, unique)',
    example: '081234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(08|62)\d{9,12}$/, {
    message: 'Format nomor telepon tidak valid (contoh: 081234567890)',
  })
  phone?: string;

  @ApiProperty({
    description: 'Password user (minimal 8 karakter, kombinasi huruf besar, kecil, angka, simbol)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol',
  })
  password: string;

  @ApiProperty({
    description: 'Role user (optional, default: staf_bidang)',
    enum: Role,
    example: Role.staf_bidang,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role tidak valid' })
  role?: Role;
}
