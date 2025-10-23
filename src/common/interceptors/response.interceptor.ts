// src/common/interceptors/response.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Definisikan struktur respons standar kita
export interface StandardResponse<T> {
  status: string;
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Cek jika data sudah dalam format standar (misalnya dari error filter)
        if (data && data.status && data.message) {
          return data;
        }

        // Jika tidak, bungkus data dalam format standar
        return {
          status: 'success',
          message:
            this.getMessageFromContext(context) || 'Request was successful',
          data: data || {},
        };
      }),
    );
  }

  // Fungsi helper untuk mencoba mendapatkan pesan dari decorator (opsional tapi canggih)
  private getMessageFromContext(context: ExecutionContext): string | null {
    const handler = context.getHandler();
    // Ambil metadata dari decorator @ResponseMessage
    return Reflect.getMetadata('response_message', handler) || null;
  }
}
