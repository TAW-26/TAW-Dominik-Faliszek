import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../config';

class AuthService {
    public async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password);
    }

    public async verifyPassword(hash: string, plain: string): Promise<boolean> {
        return await argon2.verify(hash, plain);
    }

    public generateToken(userId: string, role: string): string {
        if (!config.jwtSecret) throw new Error("JWT Secret is not defined");
        return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpiration as any});
    }

    public verifyToken(token: string): any {
        if (!config.jwtSecret) throw new Error("JWT Secret is not defined");
        return jwt.verify(token, config.jwtSecret);
    }
}

export default new AuthService();