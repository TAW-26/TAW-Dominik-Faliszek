export interface UserData {
    login: string;
    password_hash?: string;
    username: string;
    role: string;
    googleId?: string;
    created_at?: Date;
    active_device?: string;
}