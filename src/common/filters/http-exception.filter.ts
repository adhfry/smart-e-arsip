// src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Menangkap semua jenis exception
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      // Mengambil pesan error yang lebih spesifik jika ada
      message =
        typeof errorResponse === 'object' && errorResponse !== null
          ? (errorResponse as any).message || exception.message
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Membangun response error sesuai format yang Anda inginkan
    response.status(status).json({
      status: 'error',
      data: [], // Data selalu array kosong untuk error
      message: message,
      // Tambahan untuk debugging
      // timestamp: new Date().toISOString(),
      // path: request.url,
    });
  }
}
