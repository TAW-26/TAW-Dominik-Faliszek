import DeviceModel from "../schema/device_schema";
import StationModel from "../schema/station_schema";
import UserModel from "../schema/user_schema";
import HistoryService from "../service/history_service";

class DeviceService {
    private historyService: HistoryService;

    constructor() {
        this.historyService = new HistoryService();
    }

    public async addDevice(deviceData: any): Promise<any> {
        const newDevice = new DeviceModel(deviceData);
        return await newDevice.save();
    }

    public async getDevices(): Promise<any> {
        return await DeviceModel.find();
    }

    public async bindToStation(deviceId: string, stationId: string): Promise<void> {
        // ... (keep as is)
        const device = await DeviceModel.findById(deviceId);

        if (!device || device.binding_type?.toString() === 'user') {
            throw new Error('Cannot be changed now');
        }

        const newStation = await StationModel.findById(stationId);
        if (!newStation) throw new Error('Station not found');

        if (newStation.device_count >= newStation.capacity) {
            throw new Error('Station is at full capacity');
        }

        if (device.binding_type === 'station' && device.current_binding.toString() !== stationId) {
            await StationModel.findByIdAndUpdate(device.current_binding, {
                $inc: { device_count: -1 }
            });
        }

        if (device.current_binding?.toString() !== stationId) {
            await StationModel.findByIdAndUpdate(stationId, {
                $inc: { device_count: 1 }
            });
        }

        device.current_binding = stationId;
        device.binding_type = 'station';
        await device.save();
    }

    public async getAvailableDevicesByStation(stationId: string) {
      return await DeviceModel.find({
        current_binding: stationId,
        binding_type: 'station',
        status: 'available'
      });
    };

    public async rentDevice(deviceId: string, userId: string): Promise<void> {
        const device = await DeviceModel.findById(deviceId);
        if (!device || device.binding_type !== 'station') throw new Error('Device not available');

        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');
        if (user.active_device) throw new Error('User already has an active rental');

        const originalStationId = device.current_binding;

        const station = await StationModel.findById(device.current_binding);
        if (station) {
            station.device_count = Math.max(0, station.device_count - 1);
            await station.save();
        }

        device.current_binding = userId as any;
        device.binding_type = 'user';
        device.status = 'in_use';
        await device.save();

        user.active_device = device._id as any;
        await user.save();

        await this.historyService.logEvent({
            userId: user._id,
            username: user.username,
            deviceId: device._id,
            deviceType: device.type,
            stationId: originalStationId,
            stationName: station ? station.name : 'Unknown Station',
            eventType: 'RENT',
            date: new Date()
        });
    }

    public async returnDevice(deviceId: string, stationId: string, userId: string): Promise<void> {
        const device = await DeviceModel.findById(deviceId);
        if (!device || device.current_binding?.toString() !== userId) throw new Error('Device not rented by this user');

        const station = await StationModel.findById(stationId);
        if (!station) throw new Error('Station not found');
        if (station.device_count >= station.capacity) throw new Error('Station is at full capacity');

        const user = await UserModel.findById(userId);
        if (user) {
            user.active_device = null as any;
            await user.save();
        }

        station.device_count += 1;
        await station.save();

        device.current_binding = stationId as any;
        device.binding_type = 'station';
        device.status = 'available';
        await device.save();


        await this.historyService.logEvent({
            userId: user ? user._id : userId,
            username: user ? user.username : 'Unknown User',
            deviceId: device._id,
            deviceType: device.type,
            stationId: station._id,
            stationName: station.name,
            eventType: 'RETURN',
            date: new Date()
        });
    }

    public async getActiveRental(userId: string) {
        return await DeviceModel.findOne({
            current_binding: userId,
            binding_type: 'user',
        });

    }

    public async deleteDevice(deviceId: string): Promise<void> {
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        if (device.binding_type === 'station') {
            const station = await StationModel.findById(device.current_binding);
            if (station) {
                station.device_count = Math.max(0, station.device_count - 1);
                await station.save();
            }
        }

        await DeviceModel.findByIdAndDelete(deviceId);
    }

    public async updateDevice(deviceId: string, updateData: any): Promise<void> {
        const device = await DeviceModel.findByIdAndUpdate(deviceId, updateData);
        if (!device) throw new Error('Device not found');
    }
}

export default DeviceService;