import formatToTime from "../../../utils/formatToTime";
import * as Base from "./BaseTrain";
import { Station } from "./Station";
import * as ApiTypes from "../api/ElviraTypes";

export interface TrainStopInterface extends Base.BaseTrainInterface {
    station: Station;
}

export interface TrainStop extends TrainStopInterface {}
export abstract class TrainStop extends Base.BaseTrain {
    station: Station;

    protected constructor(train: TrainStopInterface) {
        super(train);

        this.station = train.station;
    }

    static createFromApi(train: ApiTypes.TrainStop) {
        const options = TrainStop.mapFromApi(train);

        if (options.start) {
            return new DepartingTrainStop(options as TrainStopInterface & Base.DepartingTrain);
        } else if (options.arrive) {
            return new ArrivingTrainStop(options as TrainStopInterface & Base.ArrivingTrain);
        } else {
            throw new Error("Either start or arrive must be defined.");
        }
    }

    static mapFromApi(train: ApiTypes.TrainStop): TrainStopInterface {
        return {
            ...super.mapFromApi(train),
            station: new Station(train.station),
        };
    }

    abstract format(): string;
}

class DepartingTrainStop extends TrainStop implements Base.DepartingTrain {
    start: Date;

    constructor(train: TrainStopInterface & Base.DepartingTrain) {
        super(train);

        this.start = new Date(train.start);
    }

    public format(): string {
        let result = `🚉 ${formatToTime(this.start)} ${this.station.name}`;

        if (this.arrive) {
            result += ` (érkezés: ${formatToTime(this.arrive)})`;
        }

        return result;
    }
}

class ArrivingTrainStop extends TrainStop implements Base.ArrivingTrain {
    arrive: Date;

    constructor(train: TrainStopInterface & Base.ArrivingTrain) {
        super(train);

        this.arrive = new Date(train.arrive);
    }

    format(): string {
        return `🚉 ${formatToTime(this.arrive)} ${this.station.name}`;
    }
}
