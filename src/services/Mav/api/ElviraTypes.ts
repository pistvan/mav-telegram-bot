/**
 * @internal Partial interface.
 */
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

type BaseTrain = (DepartingTrain | ArrivingTrain) & {
    /**
     * @format date-time
     */
    actualOrEstimatedArrive: string | null,
    /**
     * @format date-time
     */
    actualOrEstimatedStart: string | null,
    arriveTimeZone: never,
    distance: number,
    endTrack: string | null,
    endTrackType: never,
    services: never,
    startTimeZone: never,
    startTrack: string | null,
    startTrackType: never,
}

export type Train = BaseTrain & {
    aggregatedServiceIds: never,
    carrierTrains: never,
    closedTrackWay: never,
    /**
     * The identifier of the train.
     */
    code: string,
    companyCode: never,
    description: never,
    directTrains: never,
    distanceForUi: never,
    endStation: Station,
    endStationReservationCode: never,
    footer: never,
    fullName: never,
    fullShortType: never,
    fullType: never,
    havarianInfok: {
        aktualisKeses: number,
    }
    /**
     * The identifier of the vehicle.
     */
    jeEszkozAlapId: number,
    kind: never,
    kinds: never,
    kindsToDisplay: never,
    modality: never,
    name: never,
    origEndStation: never,
    origStartStation: never,
    route: never,
    sameCar: never,
    seatReservationCode: never,
    startDate: never,
    startStation: Station,
    startStationReservationCode: never,
    trainId: never,
    virtualArrive: never,
    virtualStart: never,
    viszonylatObject: never,
    viszonylatiJel: never,
}

export type TrainStop = BaseTrain & {
    station: Station,
    stopKind: never,
    stopService: never,
    transferSign: never,
}

/**
 * Represents a schedule, where the train is departing from the station.
 */
export interface DepartingTrain {
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
export interface ArrivingTrain {
    /**
     * @format date-time
     */
    start: string | null,
    /**
     * @format date-time
     */
    arrive: string,
}
