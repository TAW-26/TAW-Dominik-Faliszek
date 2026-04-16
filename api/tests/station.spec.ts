import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import UserModel from '../src/schema/user_schema';
import StationModel from '../src/schema/station_schema';

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
});

describe('Station API', () => {
    let adminToken: string;
    let userToken: string;

    /**
     * Context Setup: Creates both Admin and Regular user sessions
     * to test role-based access control (RBAC).
     */
    beforeEach(async () => {
        // Setup: Admin credentials
        await request(app).post('/api/user/register').send({ login: 'admin', password: 'pass', username: 'Admin' });
        await UserModel.updateOne({ login: 'admin' }, { role: 'admin' });
        const adminRes = await request(app).post('/api/user/login').send({ login: 'admin', password: 'pass' });
        adminToken = adminRes.body.token;

        // Setup: Regular User credentials
        await request(app).post('/api/user/register').send({ login: 'user', password: 'pass', username: 'User' });
        const userRes = await request(app).post('/api/user/login').send({ login: 'user', password: 'pass' });
        userToken = userRes.body.token;
    });

    /**
     * Access Control for Station Creation
     */
    describe('POST /api/station/create', () => {
        const newStation = {
            name: 'Test Station',
            status: 'active',
            capacity: 10,
            device_count: 0,
            lon: 21.0122,
            lat: 52.2297
        };

        it('should allow admin to create a new station', async () => {
            const res = await request(app)
                .post('/api/station/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newStation);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Station added successfully');

            const savedStation = await StationModel.findOne({ name: 'Test Station' });
            expect(savedStation).not.toBeNull();
            expect(savedStation?.capacity).toBe(10);
        });

        it('should forbid regular user from creating a station', async () => {
            const res = await request(app)
                .post('/api/station/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newStation);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Forbidden: Insufficient permissions');
        });
    });

    /**
     * General Resource Access Tests
     */
    describe('GET /api/station', () => {
        beforeEach(async () => {
            await StationModel.create({ name: 'Station A', status: 'active', capacity: 5, device_count: 0, lon: 0, lat: 0 });
            await StationModel.create({ name: 'Station B', status: 'active', capacity: 10, device_count: 5, lon: 1, lat: 1 });
        });

        it('should return a list of all stations for an authenticated user', async () => {
            const res = await request(app)
                .get('/api/station')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toBeDefined();
        });

        it('should deny access if token is missing', async () => {
            const res = await request(app).get('/api/station');
            expect(res.status).toBe(401);
        });
    });
});