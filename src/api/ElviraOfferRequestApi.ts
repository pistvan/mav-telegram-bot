import MavConfig from '../config/mav.js';
import fetch from '../utils/fetch.js';
import uuid from 'uuid-random';

export interface Station {
    id: number;
    isAlias: boolean;
    name: string;
    code: string;
    baseCode: string;
    isInternational: boolean;
    canUseForOfferRequest: boolean;
    country: string;
    countryIso: string;
    /**
     * @internal "Usually" exactly one element, but not always present because of some data inconsistency.
     */
    modalities?: {
        code: number,
    }[],
}

export const StationModalities = {
    train:    100,
    suburban: 109,
    bus:      200,
} as const;

/**
 * Returns the list of stations, including bus stations.
 */
export const getStationList = async (): Promise<Station[]> => {
    const response = await fetch<{ stations: Station[] }>(`${MavConfig.elviraBaseUri}/OfferRequestApi/GetStationList`, {
        cacheHash: '',
    }, {
        headers: {
            Language: 'hu',
            UserSessionId: uuid(),
        },
    });

    return response.stations;
}
