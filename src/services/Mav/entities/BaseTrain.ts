import * as ApiTypes from "../api/ElviraTypes";

/**
 * Represents a train, which is departing from the station.
 */
export interface DepartingTrain {
    start: Date,
}

/**
 * Represents a train, which is arriving to the station.
 */
export interface ArrivingTrain {
    arrive: Date,
}

export interface BaseTrainInterface {
    actualOrEstimatedStart?: Date;
    actualOrEstimatedArrive?: Date;
    track?: string;
    start?: Date;
    arrive?: Date;
}

export interface BaseTrain extends BaseTrainInterface {}
export abstract class BaseTrain {
    constructor(train: BaseTrainInterface) {
        this.actualOrEstimatedStart = train.actualOrEstimatedStart;
        this.actualOrEstimatedArrive = train.actualOrEstimatedArrive;
        this.track = train.track;
        this.start = train.start;
        this.arrive = train.arrive;
    }

    /**
     * @param train The train object from the API.
     */
    static mapFromApi(train: ApiTypes.BaseTrain): BaseTrainInterface {
        if (train.arrive === null && train.start === null) {
            throw new Error("Either arrive or start must be defined.");
        }

        return {
            actualOrEstimatedStart: train.actualOrEstimatedStart
                ? new Date(train.actualOrEstimatedStart)
                : undefined,
            actualOrEstimatedArrive: train.actualOrEstimatedArrive
                ? new Date(train.actualOrEstimatedArrive)
                : undefined,
            track: train.startTrack ?? train.endTrack ?? undefined,
            start: train.start ? new Date(train.start) : undefined,
            arrive: train.arrive ? new Date(train.arrive) : undefined,
        };
    }
}
