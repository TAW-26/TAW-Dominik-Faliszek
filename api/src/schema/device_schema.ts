import { Schema, model } from 'mongoose';
import { DeviceData } from "../model/device_model";

export const DeviceSchema: Schema = new Schema({
    status: { type: String, required: true },
    type: { type: String, required: true },
    current_binding: { type: Schema.Types.ObjectId, refPath: 'binding_type' },
    binding_type: { type: String, enum: ['user', 'station'] },
    updated_at: { type: Date, default: Date.now },
});

export default model<DeviceData>('device', DeviceSchema);