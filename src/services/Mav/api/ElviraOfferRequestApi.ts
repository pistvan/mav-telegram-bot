import * as MavConfig from '../config';
import fetch from '../../../utils/fetch';
import uuid from 'uuid-random';
import { Station } from './ElviraTypes';

export const StationModalities = {
    train:    100,
    suburban: 109,
    bus:      200,
} as const;

/**
 * Returns the list of stations, including bus stations.
 */
export const getStationList = async (): Promise<Station[]> => {
    const response = await fetch<{ stations: Station[] }>(`${MavConfig.ElviraBaseUri}/OfferRequestApi/GetStationList`, {
        cacheHash: '',
    }, {
        headers: {
            Language: 'hu',
            UserSessionId: uuid(),
        },
    });

    return response.stations;
}
