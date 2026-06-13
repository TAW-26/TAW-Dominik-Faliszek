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
});

describe('Additional API Logic & Edge Cases', () => {
    let adminToken: string;

    beforeEach(async () => {
        const regRes = await request(app).post('/api/user/register').send({ login: 'admin', password: 'password', username: 'Admin' });
        expect(regRes.status).toBe(201);

        await UserModel.updateOne({ login: 'admin' }, { role: 'admin' });

        const loginRes = await request(app).post('/api/user/login').send({ login: 'admin', password: 'password' });
        expect(loginRes.status).toBe(200);
        adminToken = loginRes.body.token;
    });

    describe('Security: Role Escalation Prevention', () => {
        it('should NOT allow creating an admin account via public registration even if role is provided', async () => {
            const res = await request(app).post('/api/user/register').send({
                login: 'hacker',
                password: 'password',
                username: 'Hacker',
                role: 'admin'
            });

            if (res.status === 400) {
                expect(res.status).toBe(400);
            } else {
                expect(res.status).toBe(201);
                const user = await UserModel.findOne({ login: 'hacker' });
                expect(user).not.toBeNull();
                expect(user?.role).toBe('user');
            }
        });
    });

    describe('Station Management: Deletion Rules', () => {
        it('should prevent removing a station that is not empty', async () => {
            const station = await StationModel.create({
                name: 'Busy Station', status: 'active', capacity: 10, device_count: 1, lon: 0, lat: 0
            });

            const res = await request(app)
                .delete(`/api/station/${station._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Cannot remove station: there are devices currently at this station');

            const exists = await StationModel.findById(station._id);
            expect(exists).not.toBeNull();
        });

        it('should allow removing a station when it is empty', async () => {
            const station = await StationModel.create({
                name: 'Empty Station', status: 'active', capacity: 10, device_count: 0, lon: 0, lat: 0
            });

            const res = await request(app)
                .delete(`/api/station/${station._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Station removed successfully');

            const deleted = await StationModel.findById(station._id);
            expect(deleted).toBeNull();
        });
    });

    describe('Device Management: Deletion Effects', () => {
        it('should decrement station device_count when a bound device is deleted', async () => {
            const station = await StationModel.create({
                name: 'Test Station', status: 'active', capacity: 10, device_count: 1, lon: 0, lat: 0
            });

            const device = await DeviceModel.create({
                status: 'available', type: 'bike', binding_type: 'station', current_binding: station._id
            });

            const res = await request(app)
                .delete(`/api/device/${device._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            const updatedStation = await StationModel.findById(station._id);
            expect(updatedStation?.device_count).toBe(0);

            const deletedDevice = await DeviceModel.findById(device._id);
            expect(deletedDevice).toBeNull();
        });

        it('should clear the user active_device field when an active rented device is deleted', async () => {
            const user = await UserModel.create({ login: 'renter', password_hash: 'hash', role: 'user', username: 'Renter' });
            const device = await DeviceModel.create({
                status: 'in_use', type: 'scooter', binding_type: 'user', current_binding: user._id
            });
            await UserModel.updateOne({ _id: user._id }, { active_device: device._id });

            const res = await request(app)
                .delete(`/api/device/${device._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            const updatedUser = await UserModel.findById(user._id);
            expect(updatedUser?.active_device).toBeNull();

            const deletedDevice = await DeviceModel.findById(device._id);
            expect(deletedDevice).toBeNull();
        });
    });

    describe('Resource Update (PATCH)', () => {
        it('should allow admin to update station name', async () => {
            const station = await StationModel.create({
                name: 'Old Name', status: 'active', capacity: 10, device_count: 0, lon: 0, lat: 0
            });

            const res = await request(app)
                .patch(`/api/station/${station._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name' });

            expect(res.status).toBe(200);
            const updated = await StationModel.findById(station._id);
            expect(updated?.name).toBe('New Name');
        });

        it('should prevent updating station capacity to be LESS than its current device_count', async () => {
            const station = await StationModel.create({
                name: 'Full Station', status: 'active', capacity: 5, device_count: 5, lon: 0, lat: 0
            });

            const res = await request(app)
                .patch(`/api/station/${station._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ capacity: 3 });

            expect(res.status).toBe(400);

            const unchanged = await StationModel.findById(station._id);
            expect(unchanged?.capacity).toBe(5);
        });
    });
});