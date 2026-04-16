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

    /**
     * Infrastructure Setup: Prepares Users, a Station, and an available Device.
     */
    beforeEach(async () => {
        // Prepare administrative context
        await request(app).post('/api/user/registerAdmin').send({ login: 'admin', password: 'password', username: 'Admin' });
        const adminRes = await request(app).post('/api/user/login').send({ login: 'admin', password: 'password' });
        adminToken = adminRes.body.token;

        // Setup Test User 1
        await request(app).post('/api/user/register').send({ login: 'user1', password: 'password', username: 'User One' });
        const userRes = await request(app).post('/api/user/login').send({ login: 'user1', password: 'password' });
        userToken = userRes.body.token;
        const userDoc = await UserModel.findOne({ login: 'user1' });
        testUserId = userDoc!._id.toString();

        // Setup Test User 2 (for conflict testing)
        await request(app).post('/api/user/register').send({ login: 'user2', password: 'password', username: 'User Two' });
        const user2Res = await request(app).post('/api/user/login').send({ login: 'user2', password: 'password' });
        user2Token = user2Res.body.token;

        // Initialize a Station
        const station = await StationModel.create({
            name: 'Main Station',
            status: 'active',
            capacity: 5,
            device_count: 1,
            lon: 21.0,
            lat: 52.0
        });
        testStationId = station._id.toString();

        // Initialize an available Device bound to the station
        const device = await DeviceModel.create({
            status: 'available',
            type: 'bike',
            binding_type: 'station',
            current_binding: station._id
        });
        testDeviceId = device._id.toString();
    });

    /**
     * Rental Logic: Verifies state changes across User, Device, and Station.
     */
    describe('POST /api/device/:id/rent', () => {
        it('should successfully rent an available device and update states', async () => {
            const res = await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);

            const updatedDevice = await DeviceModel.findById(testDeviceId);
            const updatedUser = await UserModel.findById(testUserId);
            const updatedStation = await StationModel.findById(testStationId);

            // Verify Device is now bound to the user
            expect(updatedDevice?.binding_type).toBe('user');
            expect(updatedDevice?.current_binding?.toString()).toBe(testUserId);
            expect(updatedDevice?.status).toBe('in_use');

            // Verify User record tracks the active device
            expect(updatedUser?.active_device?.toString()).toBe(testDeviceId);

            // Verify Station count decremented
            expect(updatedStation?.device_count).toBe(0);
        });

        it('should prevent renting if user already has an active rental', async () => {
            // Rent first device
            await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${userToken}`);

            const newDevice = await DeviceModel.create({
                status: 'available', type: 'scooter', binding_type: 'station', current_binding: testStationId
            });

            // Attempt to rent second device
            const failRes = await request(app)
                .post(`/api/device/${newDevice._id}/rent`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(failRes.status).toBe(400);
            expect(failRes.body.error).toBe('User already has an active rental');
        });

        it('should prevent renting a device that is already rented', async () => {
            // User 1 rents the device
            await request(app).post(`/api/device/${testDeviceId}/rent`).set('Authorization', `Bearer ${userToken}`);

            // User 2 attempts to rent the same device
            const failRes = await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(failRes.status).toBe(400);
            expect(failRes.body.error).toBe('Device not available');
        });
    });

    /**
     * Return Logic: Verifies station capacity validation and state restoration.
     */
    describe('POST /api/device/:id/return', () => {
        beforeEach(async () => {
            // Context: User starts with an active rental
            await request(app)
                .post(`/api/device/${testDeviceId}/rent`)
                .set('Authorization', `Bearer ${userToken}`);
        });

        it('should successfully return a device and update states', async () => {
            const res = await request(app)
                .post(`/api/device/${testDeviceId}/return`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ stationId: testStationId });

            expect(res.status).toBe(200);

            const updatedDevice = await DeviceModel.findById(testDeviceId);
            const updatedUser = await UserModel.findById(testUserId);
            const updatedStation = await StationModel.findById(testStationId);

            // Verify Device is re-bound to the station
            expect(updatedDevice?.binding_type).toBe('station');
            expect(updatedDevice?.current_binding?.toString()).toBe(testStationId);
            expect(updatedDevice?.status).toBe('available');

            // Verify User rental record is cleared
            expect(updatedUser?.active_device).toBeNull();

            // Verify Station count incremented
            expect(updatedStation?.device_count).toBe(1);
        });

        it('should prevent user from returning someone elses device', async () => {
            const failRes = await request(app)
                .post(`/api/device/${testDeviceId}/return`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ stationId: testStationId });

            expect(failRes.status).toBe(400);
            expect(failRes.body.error).toBe('Device not rented by this user');
        });

        it('should prevent returning to a full station', async () => {
            // Setup a station at max capacity
            const fullStation = await StationModel.create({
                name: 'Small Station', status: 'active', capacity: 1, device_count: 1, lon: 0, lat: 0
            });

            const res = await request(app)
                .post(`/api/device/${testDeviceId}/return`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ stationId: fullStation._id.toString() });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Station is at full capacity');

            // Device should remain with the user
            const device = await DeviceModel.findById(testDeviceId);
            expect(device?.binding_type).toBe('user');
        });
    });
});