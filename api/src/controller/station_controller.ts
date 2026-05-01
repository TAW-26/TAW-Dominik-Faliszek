import { Request, Response, Router } from 'express';
import StationService from '../service/station_service';
import { authMiddleware } from '../middleware/auth_middleware';

class StationController {
    public path = '/api/station';
    public router = Router();
    private stationService: StationService;

    constructor() {
        this.stationService = new StationService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, authMiddleware(), this.getAll);
        this.router.get(`${this.path}/available`, authMiddleware(), this.getAvailable);
        this.router.post(`${this.path}/create`, authMiddleware(['admin']), this.createNewStation);
        this.router.delete(`${this.path}/:id`, authMiddleware(['admin']), this.delete);
        this.router.patch(`${this.path}/:id`, authMiddleware(['admin']), this.update);
    }

    private getAll = async (req: Request, res: Response) => {
        try {
            const stations = await this.stationService.getStations();
            res.status(200).json(stations);
        } catch (error: any) {
            res.status(500).json({ message: 'Błąd podczas pobierania stacji.', error: error.message });
        }
    };

    private getAvailable = async (req: Request, res: Response) => {
        try {
            const stations = await this.stationService.getAvailableStations();
            res.status(200).json(stations);
        } catch (error: any) {
            res.status(500).json({ message: 'Błąd podczas pobierania dostępnych stacji.', error: error.message });
        }
    };

    private createNewStation = async (req: Request, res: Response) => {
        try {
            await this.stationService.addStation(req.body);
            res.status(200).json({ message: 'Station added successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    private delete = async (req: Request, res: Response) => {
        try {
            await this.stationService.deleteStation(req.params.id as string);
            res.status(200).json({ message: 'Station removed successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    private update = async (req: Request, res: Response) => {
        try {
            await this.stationService.updateStation(req.params.id as string, req.body);
            res.status(200).json({ message: 'Station updated successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
export default StationController;