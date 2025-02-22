import { Composer } from "telegraf"
import ElviraRepository,{ ScheduledTrain } from "../repositories/Mav/ElviraRepository.js";
import { CommandInterface, MiddlewareInterface } from "./MiddlewareInterface.js";
import formatToTime from "../utils/formatToTime.js";

const command: CommandInterface['command'] = ['allomas', 'station'];

const formatTrain = (train: ScheduledTrain): string => {
    let result = '🚂 ';

    if (ElviraRepository.isDepartingScheduledTrain(train)) {
        result += `${formatToTime(train.start)} ${train.endStation.name} felé`;

        if (train.arrive) {
            result += `, ${train.startStation.name} felől`;
        }
    } else {
        result += `${formatToTime(train.arrive)} ${train.startStation.name} felől`;
    }

    if (train.currendDelay > 0) {
        result += ` (${train.currendDelay} perc késés ⚠️)`;
    }

    return result;
}

const middleware = Composer.command(command, async (context) => {
    const payload = context.payload;

    if (payload === '') {
        await context.reply('Add meg az állomás nevét, például: /allomas Pécs');
        return;
    }

    const stations = await ElviraRepository.getStationList();
    const station = stations.find(station => station.name.toLowerCase() === payload.toLowerCase());

    if (!station) {
        await context.reply('Nem találom ezt az állomást.');
        return;
    }

    const timetable = await ElviraRepository.getStationTimetable(station.code);

    const trains = timetable.map(formatTrain);

    await context.reply(trains.join(`\n`));
});

export default {
    command,
    description: 'Állomási menetrend',
    middleware,
} satisfies MiddlewareInterface;
