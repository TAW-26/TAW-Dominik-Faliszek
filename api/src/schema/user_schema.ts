import { Schema, model } from 'mongoose';
import { UserData } from "../model/user_model";

export const UserSchema: Schema = new Schema({
    login: { type: String, required: true, unique: true },
    password_hash: { type: String, required: false },
    username: { type: String, required: true },
    role: { type: String, required: true, default: 'user', enum: ['user', 'admin'] },
    googleId: { type: String, unique: true, sparse: true },
    created_at: { type: Date, default: Date.now },
    active_device: { type: Schema.Types.ObjectId, ref: 'device', default: null },
});

export default model<UserData>('user', UserSchema);