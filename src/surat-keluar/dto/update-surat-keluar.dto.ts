import { PartialType } from '@nestjs/mapped-types';
import { CreateSuratKeluarDto } from './create-surat-keluar.dto';

export class UpdateSuratKeluarDto extends PartialType(CreateSuratKeluarDto) {}
