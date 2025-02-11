import MavConfig from '../config/mav.js';
import fetch from '../utils/fetch.js';

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
export const OperatorPrefixes = new Map<string, string>([
    ['GYSEV', '43'],
    ['HEV',   '36'],
    ['MAV',   '55'],
]);

export const getData = async (): Promise<GetDataResponse> => {
    return await fetch(`${MavConfig.vonatinfoBaseUri}/getData`, {
        a: 'TRAINS',
        jo: {
            history: false,
            id: false,
        },
    });
}
