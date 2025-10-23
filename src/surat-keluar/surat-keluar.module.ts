import { Module } from '@nestjs/common';
import { SuratKeluarService } from './surat-keluar.service';
import { SuratKeluarController } from './surat-keluar.controller';

@Module({
  controllers: [SuratKeluarController],
  providers: [SuratKeluarService],
})
export class SuratKeluarModule {}
