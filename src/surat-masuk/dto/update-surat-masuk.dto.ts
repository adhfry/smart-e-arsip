import { PartialType } from '@nestjs/mapped-types';
import { CreateSuratMasukDto } from './create-surat-masuk.dto';

export class UpdateSuratMasukDto extends PartialType(CreateSuratMasukDto) {}
