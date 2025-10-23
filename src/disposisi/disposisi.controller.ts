import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DisposisiService } from './disposisi.service';
import { CreateDisposisiDto } from './dto/create-disposisi.dto';
import { UpdateDisposisiDto } from './dto/update-disposisi.dto';

@Controller('disposisi')
export class DisposisiController {
  constructor(private readonly disposisiService: DisposisiService) {}

  @Post()
  create(@Body() createDisposisiDto: CreateDisposisiDto) {
    return this.disposisiService.create(createDisposisiDto);
  }

  @Get()
  findAll() {
    return this.disposisiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disposisiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDisposisiDto: UpdateDisposisiDto) {
    return this.disposisiService.update(+id, updateDisposisiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.disposisiService.remove(+id);
  }
}
