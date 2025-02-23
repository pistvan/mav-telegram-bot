import { Cacheable } from '@type-cacheable/core';
import { DateTime } from 'luxon';
import * as InformationApi from '../../api/ElviraInformationApi.js';
import * as OfferRequestApi from '../../api/ElviraOfferRequestApi.js';
import MavConfig from '../../config/mav.js';
import * as ApiTypes from '../../api/ElviraTypes.js';

/**
 * Represents a train, which is departing from the station.
 */
interface DepartingTrain {
    start: Date,
    arrive: Date | null,
}

/**
 * Represents a train, which is arriving to the station.
 */
interface ArrivingTrain {
    start: Date | null,
    arrive: Date,
}

export type Train = {
    actualOrEstimatedStart: Date | null,
    actualOrEstimatedArrive: Date | null,
    currendDelay: number,
    track: string | null,
    vehicleId: number,
} & Pick<
    ApiTypes.Train,
    'code' | 'startStation' | 'endStation'
> & (
    | DepartingTrain
    | ArrivingTrain
);

export type Station = Pick<ApiTypes.Station, 'code' | 'name'>;

class ElviraRepository {
    protected mapApiStation(station: ApiTypes.Station): Station {
        return {
            code: station.code,
            name: station.name,
        };
    }

    protected getTrainTiming(train: ApiTypes.ArrivingTrain | ApiTypes.DepartingTrain): ArrivingTrain | DepartingTrain {
        return InformationApi.isDepartingTrain(train)
            ? <DepartingTrain>{
                start: new Date(train.start),
                arrive: train.arrive ? new Date(train.arrive) : null,
            }
            : <ArrivingTrain>{
                start: train.start ? new Date(train.start) : null,
                arrive: new Date(train.arrive),
            };
    }

    /**
     * Converts an API train to a scheduled train.
     */
    protected mapApiTrain(train: ApiTypes.Train): Train {
        return {
            ...this.getTrainTiming(train),
            code: train.code,
            startStation: train.startStation,
            endStation: train.endStation,
            actualOrEstimatedStart: train.actualOrEstimatedStart ? new Date(train.actualOrEstimatedStart) : null,
            actualOrEstimatedArrive: train.actualOrEstimatedArrive ? new Date(train.actualOrEstimatedArrive) : null,
            currendDelay: train.havarianInfok.aktualisKeses,
            track: train.startTrack ?? train.endTrack,
            vehicleId: train.jeEszkozAlapId,
        }
    }

    public isDepartingTrain(train: Train): train is Train & DepartingTrain {
        return train.start !== null;
    }

    /**
     * Sorts the station schedulers by time.
     *
     * @returns A negative number if `a` should be before `b`, a positive number if `b` should be before `a`, and 0 if they are equal.
     */
    protected sortStationSchedulers(
        a: ApiTypes.Train,
        b: ApiTypes.Train,
    ): number {
        const aIsDeparting = InformationApi.isDepartingTrain(a);
        const bIsDeparting = InformationApi.isDepartingTrain(b);
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
    ): Promise<Train[]> {
        const apiResponse = await InformationApi.getTimetable(stationCode, date);

        // Sort the station schedulers by time.
        const stationSchedulers = [
            ...apiResponse.arrivalScheduler,
            ...apiResponse.departureScheduler,
        ];
        stationSchedulers.sort(this.sortStationSchedulers);

        const result: Train[] = [];
        const processedCodes = new Set<string>();
        for (const train of stationSchedulers) {
            // Remove duplicates (same train can be in both arrival and departure scheduler).
            if (processedCodes.has(train.code)) {
                continue;
            }

            processedCodes.add(train.code);
            result.push(this.mapApiTrain(train));
        }

        return result;
    }

    /**
     * Iterate the timetable of a station endlessly, starting from the given date.
     */
    protected async* iterateStationTimetableFrom(
        stationCode: string,
        datetime?: DateTime,
    ): AsyncGenerator<Train> {
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
    ): Promise<Train[]> {
        const startAt = DateTime.now().setZone(MavConfig.timezone);
        const scheduledTrainIterator = this.iterateStationTimetableFrom(stationCode, startAt);
        const stopTime = startAt.plus({ hours });

        const result: Train[] = [];
        for await (const train of scheduledTrainIterator) {
            const time = this.isDepartingTrain(train) ? train.start : train.arrive;
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

        return apiStations.map(this.mapApiStation);
    }
}

export default new ElviraRepository();
