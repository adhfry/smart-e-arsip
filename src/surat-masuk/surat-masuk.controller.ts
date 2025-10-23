import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SuratMasukService } from './surat-masuk.service';
import { CreateSuratMasukDto } from './dto/create-surat-masuk.dto';
import { UpdateSuratMasukDto } from './dto/update-surat-masuk.dto';

@Controller('surat-masuk')
export class SuratMasukController {
  constructor(private readonly suratMasukService: SuratMasukService) {}

  @Post()
  create(@Body() createSuratMasukDto: CreateSuratMasukDto) {
    return this.suratMasukService.create(createSuratMasukDto);
  }

  @Get()
  findAll() {
    return this.suratMasukService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suratMasukService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSuratMasukDto: UpdateSuratMasukDto) {
    return this.suratMasukService.update(+id, updateSuratMasukDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suratMasukService.remove(+id);
  }
}
