import StationModel from "../schema/station_schema";
import { StationData } from "../model/station_model";


class StationService {
    public async addStation(stationData: StationData): Promise<void> {
        const newStation = new StationModel(stationData);
        await newStation.save();
    }

    public async getStations(): Promise<any> {
        return await StationModel.find();
    }

    public async deleteStation(stationId: string): Promise<void> {
        const station = await StationModel.findById(stationId);
        if (!station) throw new Error('Station not found');

        if (station.device_count > 0) {
            throw new Error('Cannot remove station: there are devices currently at this station');
        }

        await StationModel.findByIdAndDelete(stationId);
    }

    public async updateStation(stationId: string, updateData: Partial<StationData>): Promise<void> {
        const station = await StationModel.findByIdAndUpdate(stationId, updateData);
        if (!station) throw new Error('Station not found');
    }
}
export default StationService;