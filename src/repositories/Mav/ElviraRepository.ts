import * as InformationApi from '../../api/ElviraInformationApi.js';
import * as OfferRequestApi from '../../api/ElviraOfferRequestApi.js';

/**
 * Represents a scheduled train, which is departing from the station.
 */
interface DepartingScheduledTrain {
    start: Date,
    arrive: Date | null,
}

/**
 * Represents a scheduled train, which is arriving to the station.
 */
interface ArrivingScheduledTrain {
    start: Date | null,
    arrive: Date,
}

export type ScheduledTrain = {
    actualOrEstimatedStart: Date | null,
    actualOrEstimatedArrive: Date | null,
    currendDelay: number,
    track: string | null,
} & Pick<
    InformationApi.StationScheduler,
    'code' | 'startStation' | 'endStation'
> & (
    | DepartingScheduledTrain
    | ArrivingScheduledTrain
);

/**
 * Converts an API station scheduler to a scheduled train.
 */
const mapApiStationSchedulerToScheduledTrain = (s: InformationApi.StationScheduler): ScheduledTrain => {
    const timing = InformationApi.isDepartingStationScheduler(s)
        ? <DepartingScheduledTrain>{
            start: new Date(s.start),
            arrive: s.arrive ? new Date(s.arrive) : null,
        }
        : <ArrivingScheduledTrain>{
            start: s.start ? new Date(s.start) : null,
            arrive: new Date(s.arrive),
        };

    return {
        ...timing,
        code: s.code,
        startStation: s.startStation,
        endStation: s.endStation,
        actualOrEstimatedStart: s.actualOrEstimatedStart ? new Date(s.actualOrEstimatedStart) : null,
        actualOrEstimatedArrive: s.actualOrEstimatedArrive ? new Date(s.actualOrEstimatedArrive) : null,
        currendDelay: s.havarianInfok.aktualisKeses,
        track: s.startTrack ?? s.endTrack,
    }
}

export const isDepartingScheduledTrain = (train: ScheduledTrain): train is ScheduledTrain & DepartingScheduledTrain => {
    return train.start !== null;
}

/**
 * Get the timetable of a station.
 */
export const getStationTimetable = async (stationCode: string): Promise<ScheduledTrain[]> => {
    const apiResponse = await InformationApi.getTimetable(stationCode);

    // Remove duplicates (same train can be in both arrival and departure).
    const stationSchedulers: InformationApi.StationScheduler[] = [];
    const processedCodes = new Set<string>();
    for (const trainScheduler of [...apiResponse.arrivalScheduler, ...apiResponse.departureScheduler]) {
        if (processedCodes.has(trainScheduler.code)) {
            continue;
        }

        stationSchedulers.push(trainScheduler);
        processedCodes.add(trainScheduler.code);
    }

    stationSchedulers.sort((a, b) => {
        // FIXME: what if separate trains arrive and depart at the same time?
        const aTime = new Date(InformationApi.isDepartingStationScheduler(a) ? a.start : a.arrive);
        const bTime = new Date(InformationApi.isDepartingStationScheduler(b) ? b.start : b.arrive);

        return aTime.getTime() - bTime.getTime();
    });

    return stationSchedulers.map(mapApiStationSchedulerToScheduledTrain);
}

interface Station {
    code: string;
    name: string;
}

export const getStationList = async (): Promise<Station[]> => {
    const apiResponse = await OfferRequestApi.getStationList();

    const trainModality = OfferRequestApi.StationModalities['train'];

    const apiStations = apiResponse.filter((s) => {
        if (s.isAlias) {
            return false;
        }

        if (!s.modalities) {
            return false;
        }

        return s.modalities.some((m) => m.code === trainModality);
    });

    return apiStations.map((s): Station => {
        return {
            code: s.code,
            name: s.name,
        };
    });
}
