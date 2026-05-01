import { Schema, model } from 'mongoose';
import { HistoryData } from "../model/history_model";

export const HistorySchema : Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  username: String,
  deviceId: { type: Schema.Types.ObjectId, ref: 'device', required: true },
  deviceType: String,
  stationId: { type: Schema.Types.ObjectId, ref: 'station', required: true },
  stationName: String,
  eventType: { type: String, enum: ['RENT', 'RETURN'], required: true },
  date: { type: Date, default: Date.now }
});

export default model<HistoryData>('history', HistorySchema);