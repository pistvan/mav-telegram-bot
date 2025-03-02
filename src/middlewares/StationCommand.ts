import { Composer } from "telegraf"
import { ElviraRepository } from "../services/Mav";
import { CommandInterface, MiddlewareInterface } from "./MiddlewareInterface";

/**
 * Maximum number of trains to display.
 */
const MAX_NUMBER_OF_TRAINS = 12;

/**
 * Maximum number of hours to look ahead.
 */
const MAX_HOURS = 6;

const command: CommandInterface['command'] = ['allomas', 'station'];

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

    const timetable = await ElviraRepository.getStationTimetable({
        station,
        hours: MAX_HOURS,
    });

    const trains = timetable
        .slice(0, MAX_NUMBER_OF_TRAINS)
        .map((train) => train.toString());

    await context.reply(`Ezek a vonatok indulnak ${station.name} állomásról:\n${trains.join(`\n`)}`);
});

export default {
    command,
    description: 'Állomási menetrend',
    middleware,
} satisfies MiddlewareInterface;
