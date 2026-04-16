import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import UserModel from '../src/schema/user_schema';

let mongoServer: MongoMemoryServer;

/**
 * Global Setup: Initializes an isolated in-memory MongoDB instance
 * to ensure tests run in a clean environment without affecting external databases.
 */
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
});

/**
 * Global Teardown: Cleans up the database connection and stops the in-memory server.
 */
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

/**
 * Per-Test Setup: Clears the User collection to prevent cross-test data pollution.
 */
beforeEach(async () => {
    await UserModel.deleteMany({});
});

describe('User API - Authentication and Registration', () => {

    const testUser = {
        login: 'testuser',
        password: 'Password123!',
        username: 'Test User'
    };

    /**
     * Registration Flow Tests
     */
    describe('POST /api/user/register', () => {
        it('should successfully register a new user with default role "user"', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Account created successfully');

            const savedUser = await UserModel.findOne({ login: testUser.login });
            expect(savedUser).not.toBeNull();
            expect(savedUser?.username).toBe(testUser.username);
            expect(savedUser?.role).toBe('user');
            // Ensure security by verifying the password was hashed
            expect(savedUser?.password_hash).not.toBe(testUser.password);
        });

        it('should return 400 if user login already exists', async () => {
            await request(app).post('/api/user/register').send(testUser);

            const res = await request(app)
                .post('/api/user/register')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('User already exists');
        });
    });

    /**
     * Authentication and Credential Validation Tests
     */
    describe('POST /api/user/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/user/register').send(testUser);
        });

        it('should successfully login and return a JWT token', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({
                    login: testUser.login,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(typeof res.body.token).toBe('string');
        });

        it('should return 401 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({
                    login: 'wronglogin',
                    password: testUser.password
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({
                    login: testUser.login,
                    password: 'WrongPassword!'
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });
    });

    /**
     * Administrative Authorization Tests
     */
    describe('POST /api/user/registerAdmin', () => {
        let adminToken: string;
        let regularUserToken: string;

        beforeEach(async () => {
            // Setup an existing admin to test privileged registration
            await request(app).post('/api/user/register').send({ login: 'admin1', password: 'password', username: 'Admin1' });
            await UserModel.updateOne({ login: 'admin1' }, { role: 'admin' });
            const adminLoginRes = await request(app).post('/api/user/login').send({ login: 'admin1', password: 'password' });
            adminToken = adminLoginRes.body.token;

            // Setup a regular user to test unauthorized access
            await request(app).post('/api/user/register').send(testUser);
            const userLoginRes = await request(app).post('/api/user/login').send({ login: testUser.login, password: testUser.password });
            regularUserToken = userLoginRes.body.token;
        });

        it('should successfully register an admin if request is made by an admin', async () => {
            const newAdmin = {
                login: 'admin2',
                password: 'AdminPassword123!',
                username: 'Admin Two'
            };

            const res = await request(app)
                .post('/api/user/registerAdmin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newAdmin);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Admin account created successfully');

            const savedAdmin = await UserModel.findOne({ login: newAdmin.login });
            expect(savedAdmin?.role).toBe('admin');
        });

        it('should return 403 Forbidden if a regular user tries to register an admin', async () => {
            const newAdmin = {
                login: 'admin3',
                password: 'AdminPassword123!',
                username: 'Admin Three'
            };

            const res = await request(app)
                .post('/api/user/registerAdmin')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send(newAdmin);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Forbidden: Insufficient permissions');
        });

        it('should return 401 if no authorization token is provided', async () => {
            const res = await request(app)
                .post('/api/user/registerAdmin')
                .send({
                    login: 'admin4',
                    password: 'password',
                    username: 'Admin4'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Authorization token missing');
        });
    });
});