import { Injectable } from '@nestjs/common';
import { CreateSuratKeluarDto } from './dto/create-surat-keluar.dto';
import { UpdateSuratKeluarDto } from './dto/update-surat-keluar.dto';

@Injectable()
export class SuratKeluarService {
  create(createSuratKeluarDto: CreateSuratKeluarDto) {
    return 'This action adds a new suratKeluar';
  }

  findAll() {
    return `This action returns all suratKeluar`;
  }

  findOne(id: number) {
    return `This action returns a #${id} suratKeluar`;
  }

  update(id: number, updateSuratKeluarDto: UpdateSuratKeluarDto) {
    return `This action updates a #${id} suratKeluar`;
  }

  remove(id: number) {
    return `This action removes a #${id} suratKeluar`;
  }
}
