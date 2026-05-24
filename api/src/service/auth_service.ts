import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuth2Client } from 'google-auth-library';


const googleClient = new OAuth2Client(config.googleClientID);

class AuthService {
    public async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password);
    }

    public async verifyPassword(hash: string, plain: string): Promise<boolean> {
        return await argon2.verify(hash, plain);
    }

    public generateToken(userId: string, role: string, username: string): string {
        if (!config.jwtSecret) throw new Error("JWT Secret is not defined");

        return jwt.sign(
            { userId, role, username },
            config.jwtSecret,
            { expiresIn: config.jwtExpiration as any }
        );
    }

    public verifyToken(token: string): any {
        if (!config.jwtSecret) throw new Error("JWT Secret is not defined");
        return jwt.verify(token, config.jwtSecret);
    }


    public async verifyGoogleToken(token: string) {
        if (!config.googleClientID) {
            throw new Error("Google Client ID is not defined in the environment configuration.");
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: config.googleClientID,
        });

        return ticket.getPayload();
    }
}

export default new AuthService();