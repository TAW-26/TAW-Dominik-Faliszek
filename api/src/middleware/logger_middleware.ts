import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
        };

        if (res.statusCode >= 400) {
            logger.error({ message: 'HTTP Request Error', ...logData });
        } else {
            logger.info({ message: 'HTTP Request Success', ...logData });
        }
    });

    next();
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        message: `Unhandled Exception: ${err.message}`,
        type: err.name,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip
    });

    res.status(500).json({ error: 'Internal server error.' });
};