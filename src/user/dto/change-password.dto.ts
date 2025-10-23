import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Password lama',
    example: 'OldP@ssw0rd',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'Password baru',
    example: 'NewP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  newPassword: string;
}
