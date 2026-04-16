export interface UserData {
    login: string;
    password_hash: string;
    username: string;
    role: string;
    created_at?: Date;
    active_device?: string;
}