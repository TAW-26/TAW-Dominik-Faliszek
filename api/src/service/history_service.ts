import HistoryModel from '../schema/history_schema';

export class HistoryService {

  public async logEvent(data: any) {
    const log = new HistoryModel(data);
    return await log.save();
  }

  public async getUserHistory(userId: string) {
    return await HistoryModel.find({ userId }).sort({ date: -1 });
  }

  public async getGlobalHistory() {
    return await HistoryModel.find().sort({ date: -1 });
  }
}


export default HistoryService;