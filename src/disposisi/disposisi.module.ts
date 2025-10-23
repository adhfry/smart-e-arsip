import { Module } from '@nestjs/common';
import { DisposisiService } from './disposisi.service';
import { DisposisiController } from './disposisi.controller';

@Module({
  controllers: [DisposisiController],
  providers: [DisposisiService],
})
export class DisposisiModule {}
