import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import { metricsMiddleware } from './middleware/metrics_middleware';
import { httpLogger, errorHandler } from './middleware/logger_middleware';
import UserController from './controller/user_controller';
import StationController from './controller/station_controller';
import DeviceController from './controller/device_controller';
import HistoryController from './controller/history_controller';

const app = express();

app.use(metricsMiddleware);
app.use(httpLogger);
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

const userController = new UserController();
const stationController = new StationController();
const deviceController = new DeviceController();
const historyController = new HistoryController();

app.use('/', userController.router);
app.use('/', stationController.router);
app.use('/', deviceController.router);
app.use('/', historyController.router);

app.get('/', (req: Request, res: Response) => {
    res.send('Rental API Running');
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

export default app;