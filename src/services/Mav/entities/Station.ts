import { Station as ApiStationInterface } from "../api/ElviraTypes";

interface StationInterface {
    code: string;
    name: string;
}

export interface Station extends StationInterface {}
export class Station {
    constructor(options: StationInterface) {
        this.code = options.code;
        this.name = options.name;
    }

    static createFromApi(station: ApiStationInterface) {
        return new Station({
            code: station.code,
            name: station.name,
        });
    }
}
