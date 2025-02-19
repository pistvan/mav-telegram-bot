import MavConfig from '../config/mav.js';
import fetch from '../utils/fetch.js';
import uuid from 'uuid-random';

/**
 * @link https://github.com/berenteb/mav-api-ts/blob/main/src/types/stationInfo.type.ts
 */
interface StationTimetable {
    arrivalScheduler: StationScheduler[],
    departureScheduler: StationScheduler[],
}

/**
 * Represents a schedule, where the train is departing from the station.
 */
interface DepartingStationScheduler {
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
interface ArrivingStationScheduler {
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

export interface Station {
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

/**
 * Get the scheduler list of the given station.
 *
 * The result contains the arriving and departing trains, starting from the given date, until the end of the day.
 *
 * @param stationCode The code of the station.
 * @param date The date of the timetable. If not provided, the current date will be used.
 */
export const getTimetable = async (
    stationCode: string,
    date?: Date,
): Promise<StationTimetable> => {
    const response = await fetch<{stationSchedulerDetails: StationTimetable}>(`${MavConfig.elviraBaseUri}/InformationApi/GetTimetable`, {
        type: 'StationInfo',
        minCount: '0',
        maxCount: '9999999',
        travelDate: (date ?? new Date()).toISOString(),
        stationNumberCode: stationCode,
    }, {
        headers: {
            Language: 'hu',
            UserSessionId: uuid(),
        },
    });

    return response.stationSchedulerDetails;
}
