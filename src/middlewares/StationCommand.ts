import { Composer } from "telegraf"
import { getStationList, getStationTimetable } from "../repositories/Mav/ElviraRepository.js";
import { CommandInterface, MiddlewareInterface } from "./MiddlewareInterface.js";

const command: CommandInterface['command'] = ['station', 'allomas'];

// TODO: move
const formatDate = (date: Date) => {
    return date.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

const middleware = Composer.command(command, async (context) => {
    const payload = context.payload;

    const stations = await getStationList();
    const station = stations.find(station => station.name.toLowerCase() === payload.toLowerCase());

    if (!station) {
        await context.reply('Nem találom ezt az állomást.');
        return;
    }

    const timetable = await getStationTimetable(station.code);

    const trains = timetable.map((train): string => {
        let result = '';

        if (train.arrive) {
            result += `Érkezik innen: ${train.startStation.name} @ ${formatDate(train.arrive)}`;
        }

        if (train.start) {
            result += train.arrive ? ', és indul tovább ide: ' : 'Indul ide: ';
            result += `${train.endStation.name} @ ${formatDate(train.start)}`;
        }

        result += train.currendDelay > 0
            ? `, jelenleg ${train.currendDelay} perc késéssel közlekedik.`
            : '.';

        return result;
    });

    await context.reply(trains.join(`\n`));
});

export default {
    command,
    description: 'Információ egy adott állomásról',
    middleware,
} satisfies MiddlewareInterface;
