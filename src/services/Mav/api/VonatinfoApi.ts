import * as MavConfig from '../config';
import fetch from '../../../utils/fetch';

export interface GetDataResponse {
    d: {
        result: {
            Trains: {
                Train: Array<{
                    '@Delay'?: number, // maybe optional
                    '@Lat': number,
                    '@Relation': string,
                    '@TrainNumber': string,
                    '@Menetvonal': string,
                    '@Lon': number,
                    '@ElviraID': string,
                }>
            },
        },
    }
}

/**
 * The API prefixes the train numbers with the operator's prefix.
 */
export const OperatorPrefixes = {
    GYSEV: '43',
    HEV:   '36',
    MAV:   '55',
} as const;

export const getData = async (): Promise<GetDataResponse> => {
    return await fetch(`${MavConfig.VonatinfoBaseUri}/getData`, {
        a: 'TRAINS',
        jo: {
            history: false,
            id: false,
        },
    });
}
