import { Cacheable } from '@type-cacheable/core';
import * as Api from '../../api/VonatinfoApi.js';

export interface RealtimeTrain {
    code: string,
    operator: string,
    delay: number,
    /**
     * In GeoJSON format: `[longitude, latitude]`
     */
    coordinates: [number, number],
    relation: string,
    elviraId: string,
}

class VonatinfoRepository {
    /**
     * Convert a train object from the API to a RealtimeTrain object.
     */
    protected mapApiTrainToRealtimeTrain(
        train: Api.GetDataResponse['d']['result']['Trains']['Train'][0],
    ): RealtimeTrain {
        if (!(train['@Menetvonal'] in Api.OperatorPrefixes)) {
            throw new Error(`Unknown operator for train ${train['@TrainNumber']}: ${train['@Menetvonal']}`);
        }

        const operator = train['@Menetvonal'] as keyof typeof Api.OperatorPrefixes;
        const operatorPrefix = Api.OperatorPrefixes[operator];
        let code = train['@TrainNumber'];

        if (!code.startsWith(operatorPrefix)) {
            throw new Error(`Invalid train number: ${code} operated by ${operator}, expected prefix: ${operatorPrefix}`);
        }

        code = code.slice(operatorPrefix.length).toUpperCase();

        return {
            code,
            operator,
            delay: train['@Delay'] ?? 0,
            coordinates: [train['@Lon'], train['@Lat']],
            relation: train['@Relation'],
            elviraId: train['@ElviraID'],
        };
    }

    @Cacheable({ ttlSeconds: 20 })
    public async getRealtimeTrains(): Promise<RealtimeTrain[]> {
        const apiResponse = await Api.getData();

        return apiResponse.d.result.Trains.Train.map(this.mapApiTrainToRealtimeTrain);
    }
}

export default new VonatinfoRepository();
