import * as Base from "./BaseTrain";
import * as ApiTypes from "../api/ElviraTypes";
import { Station } from "./Station";
import formatToTime from '../../../utils/formatToTime';

export interface TrainInterface extends Base.BaseTrainInterface {
    code: string;
    startStation: Station;
    endStation: Station;
    currentDelay: number;
    vehicleId: number;
}

export interface Train extends TrainInterface {}
export abstract class Train extends Base.BaseTrain {
    protected constructor(train: TrainInterface) {
        super(train);

        this.code = train.code;
        this.startStation = train.startStation;
        this.endStation = train.endStation;
        this.currentDelay = train.currentDelay;
        this.vehicleId = train.vehicleId;
    }

    static createFromApi(train: ApiTypes.Train) {
        const options = Train.mapFromApi(train);

        if (options.start) {
            return new DepartingTrain(options as TrainInterface & Base.DepartingTrain);
        } else if (options.arrive) {
            return new ArrivingTrain(options as TrainInterface & Base.ArrivingTrain);
        } else {
            throw new Error("Either start or arrive must be defined.");
        }
    }

    static mapFromApi(train: ApiTypes.Train): TrainInterface {
        return {
            ...super.mapFromApi(train),
            code: train.code,
            startStation: Station.createFromApi(train.startStation),
            endStation: Station.createFromApi(train.endStation),
            currentDelay: train.havarianInfok.aktualisKeses,
            vehicleId: train.jeEszkozAlapId,
        }
    }

    /**
     * Sorts two trains by time.
     *
     * @returns A negative number if `a` should be before `b`, a positive number if `b` should be before `a`, and 0 if they are equal.
     */
    static sorter(a: Train, b: Train): number {
        const aTime = a.getTime().getTime();
        const bTime = b.getTime().getTime();

        // Sort by time first.
        if (aTime != bTime) {
            return aTime - bTime;
        }

        // If the times are the same, the arriving train should be first.
        return (a instanceof DepartingTrain ? 0 : 1) - (b instanceof DepartingTrain ? 0 : 1);
    }

    /**
     * Get the departure or arrival time of the train (whichever is relevant).
     */
    abstract getTime(): Date;

    /**
     * Format the train to a string.
     */
    abstract toString(): string;
}

class DepartingTrain extends Train implements Base.DepartingTrain {
    start: Date;

    constructor(train: TrainInterface & Base.DepartingTrain) {
        super(train);

        this.start = new Date(train.start);
    }

    getTime() {
        return this.start;
    }

    toString() {
        let result = `🚂 ${formatToTime(this.start)} ${this.endStation.name} felé`;

        if (this.arrive) {
            result += `, ${this.startStation.name} felől`;
        }

        if (this.currentDelay > 0) {
            result += ` (${this.currentDelay} perc késés ⚠️)`;
        }

        return result;
    }
}

class ArrivingTrain extends Train implements Base.ArrivingTrain {
    arrive: Date;

    constructor(train: TrainInterface & Base.ArrivingTrain) {
        super(train);

        this.arrive = new Date(train.arrive);
    }

    getTime() {
        return this.arrive;
    }

    toString() {
        let result = `🚂 ${formatToTime(this.arrive)} ${this.startStation.name} felől`;

        if (this.currentDelay > 0) {
            result += ` (${this.currentDelay} perc késés ⚠️)`;
        }

        return result;
    }
}
