import { Injectable } from '@nestjs/common';
import { CreateDisposisiDto } from './dto/create-disposisi.dto';
import { UpdateDisposisiDto } from './dto/update-disposisi.dto';

@Injectable()
export class DisposisiService {
  create(createDisposisiDto: CreateDisposisiDto) {
    return 'This action adds a new disposisi';
  }

  findAll() {
    return `This action returns all disposisi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} disposisi`;
  }

  update(id: number, updateDisposisiDto: UpdateDisposisiDto) {
    return `This action updates a #${id} disposisi`;
  }

  remove(id: number) {
    return `This action removes a #${id} disposisi`;
  }
}
