import { Request, Response, Router } from 'express';
import UserService from '../service/user_service';
import {authMiddleware} from '../middleware/auth_middleware'

class UserController {
    public path = '/api/user';
    public router = Router();
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, this.register);
        this.router.post(`${this.path}/registerAdmin`, authMiddleware(['admin']), this.registerAdmin);
        this.router.post(`${this.path}/login`, this.login);
        this.router.post(`${this.path}/oauth`, this.googleLogin);
        this.router.get(`${this.path}/name/all`, authMiddleware(['admin']), this.getUserNames);
    }

    private register = async (request: Request, response: Response) => {
        try {
            await this.userService.registerUser(request.body, 'user');
            response.status(201).json({ message: 'Account created successfully' });
        } catch (error: any) {
            response.status(400).json({ error: error.message });
        }
    };

    private registerAdmin = async (request: Request, response: Response) => {
        try {
            await this.userService.registerUser(request.body, 'admin');
            response.status(201).json({ message: 'Admin account created successfully' });
        } catch (error: any) {
            response.status(400).json({ error: error.message });
        }
    };

    private login = async (request: Request, response: Response) => {
        try {
            const { login, password } = request.body;
            const token = await this.userService.loginUser(login, password);
            response.status(200).json({ token });
        } catch (error: any) {
            response.status(401).json({ error: error.message });
        }
    };

    private googleLogin = async (request: Request, response: Response) => {
        try {
            const { credential } = request.body;

            if (!credential) {
                return response.status(400).json({ error: 'Google credential token is required' });
            }

            const token = await this.userService.loginWithGoogle(credential);
            response.status(200).json({ token });
        } catch (error: any) {
            response.status(401).json({ error: error.message });
        }
    };

    private getUserNames = async (request: Request, response: Response) => {
        try {
            const users = await this.userService.getUserNames();
            response.status(200).json(users);
        } catch (error: any) {
            response.status(401).json({ error: error.message });
        }
    };

}
export default UserController;