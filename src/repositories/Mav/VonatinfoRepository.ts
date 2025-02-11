import * as Api from '../../api/VonatinfoApi.js';

export interface RealtimeTrain {
    trainNumber: string,
    operator: string,
    delay: number,
    coordinates: [number, number],
    relation: string,
    elviraId: string,
}

/**
 * Convert a train object from the API to a RealtimeTrain object.
 */
const mapApiTrainToRealtimeTrain = (
    train: Api.GetDataResponse['d']['result']['Trains']['Train'][0],
): RealtimeTrain => {
    const operator = train['@Menetvonal'];
    const operatorPrefix = Api.OperatorPrefixes.get(operator);

    let trainNumber = train['@TrainNumber'];

    if (operatorPrefix === undefined) {
        throw new Error(`Unknown operator for train ${trainNumber}: ${operator}`);
    }

    if (!trainNumber.startsWith(operatorPrefix)) {
        throw new Error(`Invalid train number: ${trainNumber} operated by ${operator}, expected prefix: ${operatorPrefix}`);
    }

    trainNumber = trainNumber.slice(operatorPrefix.length);

    return {
        trainNumber,
        operator,
        delay: train['@Delay'] ?? 0,
        coordinates: [train['@Lat'], train['@Lon']],
        relation: train['@Relation'],
        elviraId: train['@ElviraID'],
    };
}

export const getRealtimeTrains = async (): Promise<RealtimeTrain[]> => {
    const apiResponse = await Api.getData();

    return apiResponse.d.result.Trains.Train.map(mapApiTrainToRealtimeTrain);
};
