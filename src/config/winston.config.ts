import { format, transports } from 'winston';

export const winstonConfig = {
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.prettyPrint(),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
};