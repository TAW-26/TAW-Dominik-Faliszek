import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const config = {
    port: process.env.PORT || 3100,
    databaseUrl: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiration: '16h',
    googleClientID: process.env.GOOGLE_CLIENT_ID
};