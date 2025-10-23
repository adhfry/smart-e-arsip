import { PartialType } from '@nestjs/mapped-types';
import { CreateDisposisiDto } from './create-disposisi.dto';

export class UpdateDisposisiDto extends PartialType(CreateDisposisiDto) {}
