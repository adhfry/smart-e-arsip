import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import type { ZodSchema } from 'zod';
import { ValidationService } from '../validation.service';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private validationService: ValidationService,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.validationService.validate(this.schema, value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.issues);
      }
      throw error;
    }
  }
}
