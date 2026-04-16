import { Request, Response, NextFunction } from 'express';
import authService from '../service/auth_service';

export interface AuthRequest extends Request {
    user?: { userId: string, role: string };
}

export const authMiddleware = (allowedRoles: string[] = []) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Authorization token missing' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Token missing from authorization header' });
            return;
        }

        try {
            const decoded = authService.verifyToken(token);

            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
                return;
            }

            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
};