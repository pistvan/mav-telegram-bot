import MavConfig from '../config/mav.js';
import fetch from '../utils/fetch.js';
import uuid from 'uuid-random';
import { ArrivingTrain, DepartingTrain, Train } from './ElviraTypes.js';

/**
 * @link https://github.com/berenteb/mav-api-ts/blob/main/src/types/stationInfo.type.ts
 */
interface StationTimetable {
    arrivalScheduler: Train[],
    departureScheduler: Train[],
}

/**
 * Returns true if the given station scheduler is an arriving station scheduler.
 */
export const isDepartingTrain = (
    stationScheduler: DepartingTrain | ArrivingTrain,
): stationScheduler is DepartingTrain => {
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
