"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const logDefaults = {
    pretty: true
};
class Logger {
    prefix;
    logLevel;
    logOptions;
    constructor({ prefix, logLevel = LogLevel.DEBUG, logOptions = logDefaults }) {
        this.prefix = prefix;
        this.logLevel = logLevel;
        this.logOptions = Object.assign({}, logDefaults, logOptions);
    }
    log({ level, message, context }) {
        if (level < this.logLevel) {
            return;
        }
        const logFn = level === LogLevel.ERROR ? console.error : console.log;
        const levelName = LogLevel[level];
        const logStr = `[aaaa${levelName}] [${new Date().toISOString()}] ${message}`;
        logFn(logStr);
        if (context) {
            const contextStr = this.logOptions.pretty ? JSON.stringify(context, null, 2) : JSON.stringify(context);
            logFn(contextStr);
        }
    }
    debug(message, context) {
        this.log({ level: LogLevel.DEBUG, message, context });
    }
    info(message, context) {
        this.log({ level: LogLevel.INFO, message, context });
    }
    warn(message, context) {
        this.log({ level: LogLevel.WARN, message, context });
    }
    error(message, context) {
        this.log({ level: LogLevel.ERROR, message, context });
    }
}
exports.Logger = Logger;
