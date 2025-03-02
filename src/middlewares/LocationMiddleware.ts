import { Composer } from "telegraf";
import { MiddlewareInterface } from "./MiddlewareInterface";
import { OperatorPrefixes, RealtimeTrain, VonatinfoRepository } from "../services/Mav";
import haversineDistance from "haversine-distance";

/**
 * Maximum number of trains to display.
 */
const MAX_NUMBER_OF_TRAINS = 6;

/**
 * Maximum distance in meters to display.
 */
const MAX_DISTANCE = 100e3;

/**
 * Operators to filter for.
 */
const OPERATORS: (keyof typeof OperatorPrefixes)[] = ['GYSEV', 'MAV'];

class RealtimeTrainWithDistance extends RealtimeTrain {
    /**
     * Distance from the user's location in meters.
     */
    distance: number;

    constructor(train: RealtimeTrain, location: Parameters<typeof haversineDistance>[0]) {
        super(train);

        this.distance = haversineDistance(location, train.coordinates);
    }
}

const formatTrain = (train: RealtimeTrainWithDistance): string => {
    let message = `🚂 ${train.code} - ${train.relation} (${(train.distance / 1000).toFixed(1)} km`;

    if (train.delay > 0) {
        message += `; ${train.delay} perc késés ⚠️`;
    }

    return message += `)`;
}

const middleware = Composer.on('location', async (context) => {
    const location = context.message.location;

    // Filter based on the operator, then calculate the Haversine distance of each train from the user's location.
    const trains: RealtimeTrainWithDistance[] = (await VonatinfoRepository.getRealtimeTrains())
        .filter((train) => OPERATORS.includes(train.operator))
        .map((train) => new RealtimeTrainWithDistance(train, location))
        .filter(train => train.distance < MAX_DISTANCE);

    trains.sort((a, b) => a.distance - b.distance);

    const message = trains
        .slice(0, MAX_NUMBER_OF_TRAINS)
        .map(formatTrain);

    await context.reply(`Ezeket a vonatokat találtam a közeledben: \n${message.join(`\n`)}`);
});

export default {
    middleware
} satisfies MiddlewareInterface;
