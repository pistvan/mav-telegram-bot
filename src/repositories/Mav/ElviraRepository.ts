import { Cacheable } from '@type-cacheable/core';
import { DateTime } from 'luxon';
import * as InformationApi from '../../api/ElviraInformationApi.js';
import * as OfferRequestApi from '../../api/ElviraOfferRequestApi.js';
import MavConfig from '../../config/mav.js';

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

interface Station {
    code: string;
    name: string;
}

class ElviraRepository {
    /**
     * Converts an API station scheduler to a scheduled train.
     */
    protected mapApiStationSchedulerToScheduledTrain(s: InformationApi.StationScheduler): ScheduledTrain {
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

    public isDepartingScheduledTrain(train: ScheduledTrain): train is ScheduledTrain & DepartingScheduledTrain {
        return train.start !== null;
    }

    /**
     * Sorts the station schedulers by time.
     *
     * @returns A negative number if `a` should be before `b`, a positive number if `b` should be before `a`, and 0 if they are equal.
     */
    protected sortStationSchedulers(
        a: InformationApi.StationScheduler,
        b: InformationApi.StationScheduler,
    ): number {
        const aIsDeparting = InformationApi.isDepartingStationScheduler(a);
        const bIsDeparting = InformationApi.isDepartingStationScheduler(b);
        const aTime = new Date(aIsDeparting ? a.start : a.arrive).getTime();
        const bTime = new Date(bIsDeparting ? b.start : b.arrive).getTime();

        // Sort by time first.
        if (aTime != bTime) {
            return aTime - bTime;
        }

        // If the times are the same, the arriving train should be first.
        return (aIsDeparting ? 0 : 1) - (bIsDeparting ? 0 : 1);
    }

    /**
     * Iterate the timetable of a station starting from the given date, until the end of the day.
     */
    @Cacheable({ ttlSeconds: 7200 })
    protected async getStationTimetableForOneDay(
        stationCode: string,
        date: Date,
    ): Promise<ScheduledTrain[]> {
        const apiResponse = await InformationApi.getTimetable(stationCode, date);

        // Sort the station schedulers by time.
        const stationSchedulers = [
            ...apiResponse.arrivalScheduler,
            ...apiResponse.departureScheduler,
        ];
        stationSchedulers.sort(this.sortStationSchedulers);

        const result: ScheduledTrain[] = [];
        const processedCodes = new Set<string>();
        for (const trainScheduler of stationSchedulers) {
            // Remove duplicates (same train can be in both arrival and departure scheduler).
            if (processedCodes.has(trainScheduler.code)) {
                continue;
            }

            processedCodes.add(trainScheduler.code);
            result.push(this.mapApiStationSchedulerToScheduledTrain(trainScheduler));
        }

        return result;
    }

    /**
     * Iterate the timetable of a station endlessly, starting from the given date.
     */
    protected async* iterateStationTimetableFrom(
        stationCode: string,
        datetime?: DateTime,
    ): AsyncGenerator<ScheduledTrain> {
        datetime ??= DateTime.now();
        datetime.setZone(MavConfig.timezone);

        do {
            yield* await this.getStationTimetableForOneDay(stationCode, datetime.toJSDate());
            datetime = datetime.plus({ days: 1 }).startOf('day');
        } while (true);
    }

    /**
     * Get the timetable of a station for the next `hours` hour period.
     */
    @Cacheable({ ttlSeconds: 30 })
    public async getStationTimetable(
        stationCode: string,
        hours: number = 24,
    ): Promise<ScheduledTrain[]> {
        const startAt = DateTime.now().setZone(MavConfig.timezone);
        const scheduledTrainIterator = this.iterateStationTimetableFrom(stationCode, startAt);
        const stopTime = startAt.plus({ hours });

        const result: ScheduledTrain[] = [];
        for await (const train of scheduledTrainIterator) {
            const time = this.isDepartingScheduledTrain(train) ? train.start : train.arrive;
            if (time > stopTime.toJSDate()) {
                break;
            }

            result.push(train);
        }

        return result;
    }

    @Cacheable({ ttlSeconds: 7200 })
    public async getStationList(): Promise<Station[]> {
        const apiResponse = await OfferRequestApi.getStationList();

        const trainModality = OfferRequestApi.StationModalities['train'];

        // Filter out aliases and non-train stations.
        const apiStations = apiResponse.filter((s) => !s.isAlias)
            .filter((s) => (s.modalities ?? []).some((m) => m.code === trainModality));

        return apiStations.map((s): Station => ({
            code: s.code,
            name: s.name,
        }));
    }
}

export default new ElviraRepository();
