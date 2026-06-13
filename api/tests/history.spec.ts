import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import UserModel from '../src/schema/user_schema';
import StationModel from '../src/schema/station_schema';
import DeviceModel from '../src/schema/device_schema';
import HistoryModel from '../src/schema/history_schema';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await UserModel.deleteMany({});
    await StationModel.deleteMany({});
    await DeviceModel.deleteMany({});
    await HistoryModel.deleteMany({});
});

describe('History / Audit Log Integrity', () => {
    let userToken: string;
    let userId: string;
    let deviceId: string;
    let originStationId: string;

    beforeEach(async () => {
        const regRes = await request(app).post('/api/user/register').send({ login: 'historyuser', password: 'password', username: 'Test' });
        expect(regRes.status).toBe(201);
        const userRes = await request(app).post('/api/user/login').send({ login: 'historyuser', password: 'password' });
        expect(userRes.status).toBe(200);
        userToken = userRes.body.token;

        const userDoc = await UserModel.findOne({ login: 'historyuser' });
        userId = userDoc!._id.toString();

        const station = await StationModel.create({ name: 'Start', status: 'active', capacity: 10, device_count: 1, lon: 0, lat: 0 });
        originStationId = station._id.toString();

        const device = await DeviceModel.create({ status: 'available', type: 'bike', binding_type: 'station', current_binding: station._id });
        deviceId = device._id.toString();
    });

    it('should create an active history log when a device is rented', async () => {
        await request(app).post(`/api/device/${deviceId}/rent`).set('Authorization', `Bearer ${userToken}`);

        const logs = await HistoryModel.find({ userId: userId, deviceId: deviceId });
        expect(logs.length).toBe(1);

        const log = logs[0];
        expect(log.eventType).toBe('RENT');
        expect(log.stationId?.toString()).toBe(originStationId);
    });

    it('should finalize the history log and record end_station_id when returned', async () => {
        await request(app).post(`/api/device/${deviceId}/rent`).set('Authorization', `Bearer ${userToken}`);

        const endStation = await StationModel.create({ name: 'End', status: 'active', capacity: 10, device_count: 0, lon: 1, lat: 1 });

        await request(app)
            .post(`/api/device/${deviceId}/return`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ stationId: endStation._id.toString() });

        const logs = await HistoryModel.find({ userId: userId, deviceId: deviceId }).sort({ date: 1 });
        expect(logs.length).toBe(2);

        const returnLog = logs[1];
        expect(returnLog.eventType).toBe('RETURN');
        expect(returnLog.stationId?.toString()).toBe(endStation._id.toString());
    });

    describe('History API Endpoints (Read Access)', () => {
        let adminToken: string;

        beforeEach(async () => {
            const regAdmin = await request(app).post('/api/user/register').send({ login: 'admin', password: 'password', username: 'Admin' });
            expect(regAdmin.status).toBe(201);
            await UserModel.updateOne({ login: 'admin' }, { role: 'admin' });
            const adminRes = await request(app).post('/api/user/login').send({ login: 'admin', password: 'password' });
            expect(adminRes.status).toBe(200);
            adminToken = adminRes.body.token;

            await HistoryModel.create({
                userId: userId,
                username: 'Test',
                deviceId: deviceId,
                deviceType: 'bike',
                stationId: originStationId,
                stationName: 'Start',
                eventType: 'RENT'
            });

            await HistoryModel.create({
                userId: new mongoose.Types.ObjectId(),
                username: 'Other User',
                deviceId: deviceId,
                deviceType: 'bike',
                stationId: originStationId,
                stationName: 'Start',
                eventType: 'RENT'
            });
        });

        it('should allow a regular user to fetch ONLY their own history', async () => {
            const res = await request(app)
                .get('/api/history/user')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);

            expect(res.body.length).toBe(1);
            expect(res.body[0].username).toBe('Test');
        });

        it('should forbid a regular user from accessing the global history', async () => {
            const res = await request(app)
                .get('/api/history/global')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it('should allow an admin to fetch the global history (all logs)', async () => {
            const res = await request(app)
                .get('/api/history/global')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);

            expect(res.body.length).toBe(2);
        });
    });
});