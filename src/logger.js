const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const { cwd } = require('process');
const appRoot = cwd();
const fs = require('fs');
const path = require('path');

// Set log dir
const env = process.env.NODE_ENV || 'development';
let logDir = (env === 'test') ? 'test/data/log' : (env === 'development') ? 'data/app-log/dev' : 'data/app-log/prod';
logDir = `${appRoot}/${logDir}`;

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// const filename = path.join(logDir, 'results.log');

const transport1 = new transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const transport2 = new transports.DailyRotateFile({
  level: 'error',
  filename: path.join(logDir, 'app-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  handleExceptions: true
});

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // change level if in dev environment versus production
  level: (env === 'development' || env === 'test') ? 'debug' : 'info',
  format: format.combine(
    format.splat(),
    // format.json(),
    format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss'
    }),
    format.printf(info => `(${info.timestamp}) ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => `(${info.timestamp}) ${info.level}: ${info.message}`)
      )
    }),
    transport1,
    transport2
  ]
});
module.exports = logger;
