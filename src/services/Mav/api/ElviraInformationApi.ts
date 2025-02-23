import * as MavConfig from '../config';
import fetch from '../../../utils/fetch';
import uuid from 'uuid-random';
import { ArrivingTrain, DepartingTrain, Train, TrainStop } from './ElviraTypes';

/**
 * Returns true if the given station scheduler is an arriving station scheduler.
 */
export const isDepartingTrain = (
    stationScheduler: DepartingTrain | ArrivingTrain,
): stationScheduler is DepartingTrain => {
    return stationScheduler.start !== null;
}

type GetTimetableRequest = {
    travelDate?: Date,
} & ({
    type: 'StationInfo',
    stationNumberCode: string,
} | {
    type: 'TrainInfo',
    trainId: number,
});

/**
 * @link https://github.com/berenteb/mav-api-ts/blob/main/src/types/stationInfo.type.ts
 */
interface GetTimetableResponse {
    stationSchedulerDetails: {
        arrivalScheduler: Train[],
        departureScheduler: Train[],
    },
    trainSchedulerDetails: {
        0: {
            scheduler: TrainStop[],
            train: Train,
        },
    },
}

/**
 * Maps the request type to the response key.
 */
const ResponseKeyMapping = {
    StationInfo: 'stationSchedulerDetails',
    TrainInfo: 'trainSchedulerDetails',
} as const satisfies Record<GetTimetableRequest['type'], keyof GetTimetableResponse>;

/**
 * Get the scheduler list of the given station or train.
 *
 * The result contains the arriving and departing trains, starting from the given date, until the end of the day.
 *
 * @param stationCode The code of the station.
 * @param date The date of the timetable. If not provided, the current date will be used.
 */
export const getTimetable = async <T extends GetTimetableRequest['type']>(
    request: GetTimetableRequest & { type: T },
): Promise<GetTimetableResponse[typeof ResponseKeyMapping[T]]> => {
    const response = await fetch<GetTimetableResponse>(`${MavConfig.ElviraBaseUri}/InformationApi/GetTimetable`, {
        minCount: '0',
        maxCount: '9999999',
        ...request,
        travelDate: (request.travelDate ?? new Date()).toISOString(),
    }, {
        headers: {
            Language: 'hu',
            UserSessionId: uuid(),
        },
    });

    return response[ResponseKeyMapping[request.type]];
}
