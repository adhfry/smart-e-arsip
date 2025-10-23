import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('🏥 Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Check if API is running and responsive'
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('api/health')
  @ApiOperation({ 
    summary: 'API Health check endpoint',
    description: 'Check if API with prefix is running'
  })
  getApiHealth() {
    return {
      status: 'ok',
      message: 'Smart E-Arsip API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
// Modified Thu Oct 23 22:07:37 SEAST 2025
