import * as Api from '../api/VonatinfoApi';

interface RealtimeTrainInterface {
    code: string,
    operator: keyof typeof Api.OperatorPrefixes,
    delay: number,
    /**
     * In GeoJSON format: `[longitude, latitude]`
     */
    coordinates: [number, number],
    relation: string,
    elviraId: string,
}

export interface RealtimeTrain extends RealtimeTrainInterface {}
export class RealtimeTrain {
    constructor(options: RealtimeTrainInterface) {
        this.code = options.code;
        this.operator = options.operator;
        this.delay = options.delay;
        this.coordinates = options.coordinates;
        this.relation = options.relation;
        this.elviraId = options.elviraId;
    }

    static createFromApi(data: Api.GetDataResponse['d']['result']['Trains']['Train'][0]) {
        if (!(data['@Menetvonal'] in Api.OperatorPrefixes)) {
            throw new Error(`Unknown operator for train ${data['@TrainNumber']}: ${data['@Menetvonal']}`);
        }

        const operator = data['@Menetvonal'] as keyof typeof Api.OperatorPrefixes;
        const operatorPrefix = Api.OperatorPrefixes[operator];
        let code = data['@TrainNumber'];

        if (!code.startsWith(operatorPrefix)) {
            throw new Error(`Invalid train number: ${code} operated by ${operator}, expected prefix: ${operatorPrefix}`);
        }

        return new RealtimeTrain({
            code: code.slice(operatorPrefix.length).toUpperCase(),
            operator,
            delay: data['@Delay'] ?? 0,
            coordinates: [data['@Lon'], data['@Lat']],
            relation: data['@Relation'],
            elviraId: data['@ElviraID'],
        });
    }
}
