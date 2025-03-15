import { Cacheable } from '@type-cacheable/core';
import * as Api from '../api/VonatinfoApi';
import { RealtimeTrain } from '../entities/RealtimeTrain';

export interface VonatinfoRepositoryInterface {
    getRealtimeTrains(): Promise<RealtimeTrain[]>;
}

class VonatinfoRepository implements VonatinfoRepositoryInterface {
    @Cacheable({ ttlSeconds: 20 })
    public async getRealtimeTrains(): Promise<RealtimeTrain[]> {
        const apiResponse = await Api.getData();

        return apiResponse.d.result.Trains.Train.map(RealtimeTrain.createFromApi);
    }
}

export default new VonatinfoRepository();
