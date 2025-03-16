import { Station as ApiStationInterface } from "../api/ElviraTypes";

interface StationInterface {
    code: string;
    name: string;
    /**
     * ISO code of the country where the station is located.
     */
    countryCode: string;
}

export interface Station extends StationInterface {}
export class Station {
    constructor(options: StationInterface) {
        this.code = options.code;
        this.name = options.name;
        this.countryCode = options.countryCode;
    }

    static createFromApi(station: ApiStationInterface) {
        return new Station({
            ...station,
            countryCode: station.coutryIso,
        });
    }
}
