import { Cacheable } from '@type-cacheable/core';
import { DateTime } from 'luxon';
import * as InformationApi from '../api/ElviraInformationApi';
import * as OfferRequestApi from '../api/ElviraOfferRequestApi';
import * as MavConfig from '../config';
import { TrainStop } from '../entities/TrainStop';
import { Station } from '../entities/Station';
import { Train } from '../entities/Train';

class ElviraRepository {
    /**
     * Iterate the timetable of a station starting from the given date, until the end of the day.
     */
    @Cacheable({ ttlSeconds: 7200 })
    public async getStationTimetableForOneDay(
        stationCode: string,
        date: Date,
    ): Promise<Train[]> {
        const apiResponse = await InformationApi.getTimetable({
            type: 'StationInfo',
            stationNumberCode: stationCode,
            travelDate: date,
        });

        // Map the response to trains, then sort them by time.
        const stationSchedulerTrains = [
            ...apiResponse.arrivalScheduler,
            ...apiResponse.departureScheduler,
        ].map(Train.createFromApi);
        stationSchedulerTrains.sort(Train.sorter);

        const result: Train[] = [];
        const processedCodes = new Set<string>();
        for (const train of stationSchedulerTrains) {
            // Remove duplicates (same train can be in both arrival and departure scheduler).
            if (processedCodes.has(train.code)) {
                continue;
            }

            processedCodes.add(train.code);
            result.push(train);
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
        datetime.setZone(MavConfig.ElviraTimezone);

        do {
            yield* await this.getStationTimetableForOneDay(stationCode, datetime.toJSDate());
            datetime = datetime.plus({ days: 1 }).startOf('day');
        } while (true);
    }

    /**
     * Get the timetable of a station, starting from `date`, for the next `hours` hour period.
     */
    @Cacheable({ ttlSeconds: 30 })
    public async getStationTimetable(options: {
        station: string | Station,
        date?: Date,
        hours?: number,
    }): Promise<Train[]> {
        const startAt = (options.date ? DateTime.fromJSDate(options.date) : DateTime.now())
            .setZone(MavConfig.ElviraTimezone);

        const stationCode = typeof options.station === 'string' ? options.station : options.station.code;
        const scheduledTrainIterator = this.iterateStationTimetableFrom(stationCode, startAt);
        const stopTime = startAt.plus({ hours: options.hours ?? 24 }).toJSDate();

        const result: Train[] = [];
        for await (const train of scheduledTrainIterator) {
            if (train.getTime() > stopTime) {
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

        return apiStations.map(Station.createFromApi);
    }

    public async getStationByName(name: string): Promise<Station | undefined> {
        const stationList = await this.getStationList();

        return stationList.find((s) => s.name.toLowerCase() === name.toLowerCase());
    }

    public async getTrainStops(vehicleId: number): Promise<TrainStop[]> {
        const apiResponse = await InformationApi.getTimetable({
            type: 'TrainInfo',
            trainId: vehicleId,
            travelDate: new Date(),
        });

        return apiResponse[0].scheduler.map(TrainStop.createFromApi);
    }
}

export default new ElviraRepository();
