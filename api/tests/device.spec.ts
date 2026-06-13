import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import UserModel from '../src/schema/user_schema';
import StationModel from '../src/schema/station_schema';
import DeviceModel from '../src/schema/device_schema';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await UserModel.deleteMany({});
    await StationModel.deleteMany({});
    await DeviceModel.deleteMany({});
});

describe('Device API - Rent and Return Logic', () => {

    let adminToken: string;
    let userToken: string;
    let user2Token: string;
    let testUserId: string;
    let testStationId: string;
    let testDeviceId: string;

    beforeEach(async () => {
        const adminReg = await request(app).post('/api/user/register').send({ login: 'admin', password: 'password', username: 'Admin' });
        expect(adminReg.status).toBe(201);
        await UserModel.updateOne({ login: 'admin' }, { role: 'admin' });
        const adminRes = await request(app).post('/api/user/login').send({ login: 'admin', password: 'password' });
        expect(adminRes.status).toBe(200);
        adminToken = adminRes.body.token;

        const u1Reg = await request(app).post('/api/user/register').send({ login: 'user1', password: 'password', username: 'User One' });
        expect(u1Reg.status).toBe(201);
        const userRes = await request(app).post('/api/user/login').send({ login: 'user1', password: 'password' });
        expect(userRes.status).toBe(200);
        userToken = userRes.body.token;
        const userDoc = await UserModel.findOne({ login: 'user1' });
        testUserId = userDoc!._id.toString();

        const u2Reg = await request(app).post('/api/user/register').send({ login: 'user2', password: 'password', username: 'User Two' });
        expect(u2Reg.status).toBe(201);
        const user2Res = await request(app).post('/api/user/login').send({ login: 'user2', password: 'password' });
        expect(user2Res.status).toBe(200);
        user2Token = user2Res.body.token;

        const station = await StationModel.create({
            name: 'Main Station', status: 'active', capacity: 5, device_count: 1, lon: 21.0, lat: 52.0
        });
        testStationId = station._id.toString();

        const device = await DeviceModel.create({
            status: 'available', type: 'bike', binding_type: 'station', current_binding: station._id
        });
        testDeviceId = device._id.toString();
    });

    describe('POST /api/device/:id/rent', () => {
        it('should successfully rent an available device and update states', async () => {
            const res = await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);

            const updatedDevice = await DeviceModel.findById(testDeviceId);
            const updatedUser = await UserModel.findById(testUserId);
            const updatedStation = await StationModel.findById(testStationId);

            expect(updatedDevice?.binding_type).toBe('user');
            expect(updatedDevice?.status).toBe('in_use');
            expect(updatedUser?.active_device?.toString()).toBe(testDeviceId);
            expect(updatedStation?.device_count).toBe(0);
        });

        it('should prevent renting if user already has an active rental', async () => {
            await request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);
            const newDevice = await DeviceModel.create({
                status: 'available', type: 'scooter', binding_type: 'station', current_binding: testStationId
            });

            const failRes = await request(app).post(`/api/device/${newDevice._id}/rent`).set('Authorization', `Bearer ${userToken}`);
            expect(failRes.status).toBe(400);
            expect(failRes.body.message).toBe('User already has an active rental');
        });

        it('should prevent renting a device that is already in use', async () => {
            await request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);

            const res = await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(res.status).toBe(400);

            const device = await DeviceModel.findById(testDeviceId);
            expect(device?.current_binding?.toString()).toBe(testUserId);
        });

        it('should prevent race conditions if two users try to rent the same device simultaneously', async () => {
            const req1 = request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);
            const req2 = request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${user2Token}`);

            await Promise.all([req1, req2]);

            const station = await StationModel.findById(testStationId);
            expect(station?.device_count).toBeGreaterThanOrEqual(0);

            const usersWithDevice = await UserModel.countDocuments({ active_device: testDeviceId });
            expect(usersWithDevice).toBeLessThanOrEqual(1);
        });
    });

    describe('POST /api/device/:id/return', () => {
        it('should prevent returning a device that is already available (not rented)', async () => {
            const res = await request(app)
                .post(`/api/device/${testDeviceId}/return`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ stationId: testStationId });

            expect(res.status).toBe(400);

            const station = await StationModel.findById(testStationId);
            expect(station?.device_count).toBe(1);
        });

        describe('When device is rented', () => {
            beforeEach(async () => {
                await request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);
            });

            it('should successfully return a device to its original station', async () => {
                const res = await request(app)
                    .post(`/api/device/${testDeviceId}/return`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ stationId: testStationId });

                expect(res.status).toBe(200);

                const updatedDevice = await DeviceModel.findById(testDeviceId);
                const updatedUser = await UserModel.findById(testUserId);
                const updatedStation = await StationModel.findById(testStationId);

                expect(updatedDevice?.binding_type).toBe('station');
                expect(updatedDevice?.status).toBe('available');
                expect(updatedUser?.active_device).toBeNull();
                expect(updatedStation?.device_count).toBe(1);
            });

            it('should prevent a user from returning a device rented by someone else', async () => {
                const res = await request(app)
                    .post(`/api/device/${testDeviceId}/return`)
                    .set('Authorization', `Bearer ${user2Token}`)
                    .send({ stationId: testStationId });

                expect(res.status).toBeGreaterThanOrEqual(400);

                const device = await DeviceModel.findById(testDeviceId);
                expect(device?.status).toBe('in_use');
                expect(device?.current_binding?.toString()).toBe(testUserId);
            });

            it('should prevent returning to a full station', async () => {
                const fullStation = await StationModel.create({
                    name: 'Small Station', status: 'active', capacity: 1, device_count: 1, lon: 0, lat: 0
                });

                const res = await request(app)
                    .post(`/api/device/${testDeviceId}/return`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ stationId: fullStation._id.toString() });

                expect(res.status).toBe(400);
                expect(res.body.error).toBe('Station is at full capacity');
            });

            it('should correctly handle cross-station returns, balancing inventory', async () => {
                const stationB = await StationModel.create({
                    name: 'Destination Station', status: 'active', capacity: 5, device_count: 0, lon: 0, lat: 0
                });

                const res = await request(app)
                    .post(`/api/device/${testDeviceId}/return`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ stationId: stationB._id.toString() });

                expect(res.status).toBe(200);

                const originStation = await StationModel.findById(testStationId);
                expect(originStation?.device_count).toBe(0);

                const destinationStation = await StationModel.findById(stationB._id);
                expect(destinationStation?.device_count).toBe(1);
            });

            it('should fail gracefully if returning to a non-existent station ID', async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();
                const res = await request(app)
                    .post(`/api/device/${testDeviceId}/return`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ stationId: fakeId });

                expect(res.status).toBe(400);
            });
        });
    });

    describe('GET /api/device/active', () => {
        it('should return the currently rented device for the user', async () => {
            await request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);

            const res = await request(app)
                .get('/api/device/active')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body).not.toBeNull();
            expect(res.body._id).toBe(testDeviceId);
        });

        it('should return null if user has no active rental', async () => {
            const res = await request(app)
                .get('/api/device/active')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });
    });

    describe('Admin Device Management (Create & Bind)', () => {
        it('should allow an admin to create a new device', async () => {
            const res = await request(app)
                .post('/api/device/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ type: 'scooter', status: 'available', binding_type: 'station', current_binding: testStationId });

            expect(res.status).toBe(200);
            expect(res.body._id).toBeDefined();

            const newDevice = await DeviceModel.findById(res.body._id);
            expect(newDevice).not.toBeNull();
            expect(newDevice?.type).toBe('scooter');
        });

        it('should allow an admin to bind a device to a new station and update counts', async () => {
            const stationB = await StationModel.create({
                name: 'New Station', status: 'active', capacity: 10, device_count: 0, lon: 0, lat: 0
            });

            const res = await request(app)
                .post(`/api/device/${testDeviceId}/bind`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ stationId: stationB._id.toString() });

            expect(res.status).toBe(200);

            const updatedStationB = await StationModel.findById(stationB._id);
            expect(updatedStationB?.device_count).toBe(1);

            const updatedStationA = await StationModel.findById(testStationId);
            expect(updatedStationA?.device_count).toBe(0);
        });

        it('should prevent admin from binding a device to a station at full capacity', async () => {
            const fullStation = await StationModel.create({
                name: 'Full Station', status: 'active', capacity: 1, device_count: 1, lon: 0, lat: 0
            });

            const res = await request(app)
                .post(`/api/device/${testDeviceId}/bind`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ stationId: fullStation._id.toString() });

            expect(res.status).toBe(400);

            const station = await StationModel.findById(fullStation._id);
            expect(station?.device_count).toBe(1);
        });
    });

    describe('Device Read & Update', () => {
        it('should allow admin to get all devices', async () => {
            const res = await request(app)
                .get('/api/device')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should fetch available devices for a specific station', async () => {
            const res = await request(app)
                .get(`/api/device/${testStationId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]._id).toBe(testDeviceId);
        });

        it('should allow admin to update device properties', async () => {
            const res = await request(app)
                .patch(`/api/device/${testDeviceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ type: 'electric_bike' });

            expect(res.status).toBe(200);

            const updated = await DeviceModel.findById(testDeviceId);
            expect(updated?.type).toBe('electric_bike');
        });
    });
});