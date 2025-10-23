import { Injectable } from '@nestjs/common';
import { CreateSuratMasukDto } from './dto/create-surat-masuk.dto';
import { UpdateSuratMasukDto } from './dto/update-surat-masuk.dto';

@Injectable()
export class SuratMasukService {
  create(createSuratMasukDto: CreateSuratMasukDto) {
    return 'This action adds a new suratMasuk';
  }

  findAll() {
    return `This action returns all suratMasuk`;
  }

  findOne(id: number) {
    return `This action returns a #${id} suratMasuk`;
  }

  update(id: number, updateSuratMasukDto: UpdateSuratMasukDto) {
    return `This action updates a #${id} suratMasuk`;
  }

  remove(id: number) {
    return `This action removes a #${id} suratMasuk`;
  }
}
