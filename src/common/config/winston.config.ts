import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { formatInTimeZone } from 'date-fns-tz';

export const winstonConfig: winston.LoggerOptions = {
  transports: [
    new winston.transports.Console({
      level: 'silly',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ level, message, context, timestamp, ms }) => {
          const timeZone = 'Asia/Jakarta';
          const formattedTimestamp = formatInTimeZone(
            new Date(timestamp as string),
            timeZone,
            'HH:mm:ss',
          );
          return `[Smart E-Arsip] ${formattedTimestamp} WIB - [${context}] ${level}: ${message} ${ms}`;
        }),
      ),
    }),

    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
