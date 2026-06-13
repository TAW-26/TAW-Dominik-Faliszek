import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import UserController from './controller/user_controller';
import StationController from './controller/station_controller';
import DeviceController from './controller/device_controller';
import HistoryController from './controller/history_controller';

const app = express();

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

export default app;