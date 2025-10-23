import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Smart E-Arsip API v.1.0.0 is ready!';
  }
}
