import { Composer } from "telegraf"
import { getRealtimeTrains } from "../repositories/Mav/VonatinfoRepository.js";
import { CommandInterface, MiddlewareInterface } from "./MiddlewareInterface.js";

const command: CommandInterface['command'] = ['train', 'vonat'];

const middleware = Composer.command(command, async (context) => {
    if (!/^\d+$/.test(context.payload)) {
        await context.reply('A vonatszám csak szám lehet.');
        return;
    }
    const trainNumber = context.payload.toUpperCase();

    const realtimeTrains = await getRealtimeTrains();
    const train = realtimeTrains.find(train => train.trainNumber === trainNumber);

    if (!train) {
        await context.reply('Jelenleg nem közlekedik ilyet vonat.');
        return;
    }

    await context.reply(`Ez a vonat jelenleg ${train.relation} viszonylaton jár, és ${train.delay} perc késéssel közlekedik.`);
});

export default {
    command,
    description: 'Információ egy adott számú vonatról',
    middleware,
} satisfies MiddlewareInterface;
