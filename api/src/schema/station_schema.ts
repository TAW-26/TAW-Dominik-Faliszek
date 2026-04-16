import { Schema, model } from 'mongoose';
import { StationData } from "../model/station_model";

export const StationSchema: Schema = new Schema({
    name: { type: String, required: true },
    status: { type: String, required: true },
    capacity: { type: Number, required: true },
    device_count: { type: Number, required: true, default: 0 },
    lon: { type: Number, required: true },
    lat: { type: Number, required: true },
});

export default model<StationData>('station', StationSchema);