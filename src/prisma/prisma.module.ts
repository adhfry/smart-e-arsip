// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Buat modul ini Global
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Ekspor service-nya
})
export class PrismaModule {}
