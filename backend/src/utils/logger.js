// Placeholder file
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  }

  writeLog(level, message, meta = {}) {
    const logMessage = this.formatMessage(level, message, meta);
    const logFile = path.join(this.logDir, `${level}.log`);
    
    fs.appendFileSync(logFile, logMessage + '\n');
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage);
    }
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  debug(message, meta = {}) {
    this.writeLog('debug', message, meta);
  }
}

module.exports = new Logger();
