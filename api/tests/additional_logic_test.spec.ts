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
        // Standard setup for administrative authorization tests
        await request(app).post('/api/user/register').send({ login: 'admin', password: 'password', username: 'Admin' });
        await UserModel.updateOne({ login: 'admin' }, { role: 'admin' });
        const res = await request(app).post('/api/user/login').send({ login: 'admin', password: 'password' });
        adminToken = res.body.token;
    });

    /**
     * Security Hardening: Prevents users from manually escalating their privileges
     * via the public registration endpoint.
     */
    describe('Security: Role Escalation Prevention', () => {
        it('should NOT allow creating an admin account via public registration even if role is provided', async () => {
            await request(app).post('/api/user/register').send({
                login: 'hacker',
                password: 'password',
                username: 'Hacker',
                role: 'admin' // Attempt to inject administrative role
            });

            const user = await UserModel.findOne({ login: 'hacker' });
            expect(user).not.toBeNull();
            // Verify application-side role enforcement (should revert to default)
            expect(user?.role).toBe('user');
        });
    });

    /**
     * Data Integrity: Validates that stations cannot be deleted while they
     * still host physical inventory.
     */
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

    /**
     * Cascading Effects: Ensures system-wide counts remain accurate
     * when individual items are deleted.
     */
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

            // Verify station inventory state is updated after item removal
            const updatedStation = await StationModel.findById(station._id);
            expect(updatedStation?.device_count).toBe(0);
        });
    });

    /**
     * Resource Management: Administrative update capabilities.
     */
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
    });
});