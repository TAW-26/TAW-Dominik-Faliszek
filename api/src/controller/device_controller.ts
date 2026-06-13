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
        this.router.get(`${this.path}/active`, authMiddleware(['user']), this.getActiveRental);
        this.router.get(this.path, authMiddleware(['admin']), this.getAllDevices);
        this.router.get(`${this.path}/:stationId`, authMiddleware(), this.getAvailableDevicesByStation);
        this.router.post(`${this.path}/create`, authMiddleware(['admin']), this.createNewDevice);
        this.router.post(`${this.path}/:id/bind`, authMiddleware(['admin']), this.bindToStation);
        this.router.post(`${this.path}/:id/rent`, authMiddleware(['user']), this.rentDevice);
        this.router.post(`${this.path}/:id/return`, authMiddleware(['user']), this.returnDevice);
        this.router.delete(`${this.path}/:id`, authMiddleware(['admin']), this.deleteDevice);
        this.router.patch(`${this.path}/:id`, authMiddleware(['admin']), this.updateDevice);
    }

    private getAllDevices = async (req: AuthRequest, res: Response) => {
        try {
            const devices = await this.deviceService.getDevices();
            res.status(200).json(devices);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching devices', error: error.message });
        }
    };

    private getAvailableDevicesByStation = async (req: AuthRequest, res: Response) => {
        try {
            const devices = await this.deviceService.getAvailableDevicesByStation(req.params.stationId as string);
            res.status(200).json(devices);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching station devices', error: error.message });
        }
    };

    private getActiveRental = async (req: AuthRequest, res: Response) => {
        try {
            const device = await this.deviceService.getActiveRental(req.user!.userId);
            res.status(200).json(device);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    private createNewDevice = async (req: AuthRequest, res: Response) => {
        try {
            const device = await this.deviceService.addDevice(req.body);
            res.status(200).json({ message: 'Device added successfully', _id: device._id });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    private bindToStation = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.bindToStation(req.params.id as string, req.body.stationId);
            res.status(200).json({ message: 'Device bound successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private rentDevice = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.rentDevice(req.params.id as string, req.user!.userId);
            res.status(200).json({ message: 'Device rented successfully' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };

    private returnDevice = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.returnDevice(req.params.id as string, req.body.stationId, req.user!.userId);
            res.status(200).json({ message: 'Device returned successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private deleteDevice = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.deleteDevice(req.params.id as string);
            res.status(200).json({ message: 'Device removed successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private updateDevice = async (req: AuthRequest, res: Response) => {
        try {
            await this.deviceService.updateDevice(req.params.id as string, req.body);
            res.status(200).json({ message: 'Device updated successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
export default DeviceController;