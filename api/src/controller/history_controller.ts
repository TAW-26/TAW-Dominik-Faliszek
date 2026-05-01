import { Request, Response, Router } from 'express';
import { HistoryService } from '../service/history_service';
import { authMiddleware } from '../middleware/auth_middleware';


export class HistoryController {

    public path = '/api/history';
    public router = Router();
    private historyService: HistoryService;

    constructor() {
        this.historyService = new HistoryService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/user`, authMiddleware(), this.getUserHistory);
        this.router.get(`${this.path}/global`, authMiddleware(['admin']), this.getGlobalHistory);
    }




  private getUserHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const logs = await this.historyService.getUserHistory(userId);
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ message: 'Błąd podczas pobierania historii.', error: error.message });
    }
  }

  private getGlobalHistory = async (req: Request, res: Response) => {
    try {
        const history = await this.historyService.getGlobalHistory();
        res.status(200).json(history);
    } catch (error: any) {
        res.status(500).json({ message: 'Błąd podczas pobierania historii globalnej.', error: error.message });
    }
  }
}


export default HistoryController