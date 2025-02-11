import MavConfig from '../config/mav.js';
import fetch from '../utils/fetch.js';

/**
 * @link https://github.com/berenteb/mav-api-ts/blob/main/src/types/stationInfo.type.ts
 */
export interface StationTimetable {
    arrivalScheduler: StationScheduler[],
    departureScheduler: StationScheduler[],
}

/**
 * Represents a schedule, where the train is departing from the station.
 */
export interface DepartingStationScheduler {
    /**
     * @format date-time
     */
    start: string,
    /**
     * @format date-time
     */
    arrive: string | null,
}

/**
 * Represents a schedule, where the train is arriving to the station.
 */
export interface ArrivingStationScheduler {
    /**
     * @format date-time
     */
    start: string | null,
    /**
     * @format date-time
     */
    arrive: string,
}

export type StationScheduler = {
    /**
     * The identifier of the train.
     */
    code: string,
    startStation: Station,
    endStation: Station,
    /**
     * @format date-time
     */
    actualOrEstimatedStart: string | null,
    /**
     * @format date-time
     */
    actualOrEstimatedArrive: string | null,
    havarianInfok: {
        aktualisKeses: number,
    }
    startTrack: string | null,
    endTrack: string | null,
} & (DepartingStationScheduler | ArrivingStationScheduler);

interface Station {
    id: number,
    name: string,
    code: string,
}

/**
 * Returns true if the given station scheduler is an arriving station scheduler.
 */
export const isDepartingStationScheduler = (
    stationScheduler: DepartingStationScheduler | ArrivingStationScheduler,
): stationScheduler is DepartingStationScheduler => {
    return stationScheduler.start !== null;
}

export const getTimetable = async (stationCode: string): Promise<StationTimetable> => {
    const response = await fetch<{stationSchedulerDetails: StationTimetable}>(`${MavConfig.elviraBaseUri}/InformationApi/GetTimetable`, {
        type: 'StationInfo',
        minCount: '0',
        maxCount: '9999999',
        travelDate: (new Date()).toISOString(),
        stationNumberCode: stationCode,
    }, {
        headers: {
            Language: 'hu',
            UserSessionId: '1',
        },
    });

    return response.stationSchedulerDetails;
}
