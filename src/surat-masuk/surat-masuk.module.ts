import { Module } from '@nestjs/common';
import { SuratMasukService } from './surat-masuk.service';
import { SuratMasukController } from './surat-masuk.controller';

@Module({
  controllers: [SuratMasukController],
  providers: [SuratMasukService],
})
export class SuratMasukModule {}
