import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token untuk autentikasi',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token untuk mendapatkan access token baru',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Tipe token',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Waktu kadaluarsa token dalam detik',
    example: 900,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Informasi user yang login',
    example: {
      id: 1,
      username: 'ahda.admin',
      nama_lengkap: 'Ahda Ahda',
      email: 'ahda@smartearsip.id',
      role: 'admin',
    },
  })
  user: {
    id: number;
    username: string;
    nama_lengkap: string;
    email: string | null;
    role: string;
  };
}
