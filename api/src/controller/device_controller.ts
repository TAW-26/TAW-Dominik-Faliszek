import { Response, Router } from 'express';
import DeviceService from '../service/device_service';
import { authMiddleware, AuthRequest } from '../middleware/auth_middleware';

class DeviceController {
    public path = '/api/device';
    public router = Router();
    private deviceService: DeviceService;

    constructor() {
        this.deviceService = new DeviceService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, authMiddleware(), this.getAll);
        this.router.post(`${this.path}/create`, authMiddleware(['admin']), this.createNewDevice);
        this.router.post(`${this.path}/:id/rent`, authMiddleware(['user']), this.rent);
        this.router.post(`${this.path}/:id/return`, authMiddleware(['user']), this.return);
        this.router.delete(`${this.path}/:id`, authMiddleware(['admin']), this.delete);
        this.router.patch(`${this.path}/:id`, authMiddleware(['admin']), this.update);
    }

    private getAll = async (req: AuthRequest, res: Response) => {
        const devices = await this.deviceService.getDevices();
        res.status(200).json(devices);
    }

    private createNewDevice = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.addDevice(req.body);
            res.status(200).json({ message: 'Device added successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    private rent = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.rentDevice(req.params.id as string, req.user!.userId);
            res.status(200).json({ message: 'Device rented successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private return = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.returnDevice(req.params.id as string, req.body.stationId, req.user!.userId);
            res.status(200).json({ message: 'Device returned successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private delete = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.deleteDevice(req.params.id as string);
            res.status(200).json({ message: 'Device removed successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private update = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.updateDevice(req.params.id as string, req.body);
            res.status(200).json({ message: 'Device updated successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
export default DeviceController;