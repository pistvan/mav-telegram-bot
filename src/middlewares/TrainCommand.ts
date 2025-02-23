import { Composer } from "telegraf"
import { VonatinfoRepository } from "../services/Mav";
import { CommandInterface, MiddlewareInterface } from "./MiddlewareInterface";

const command: CommandInterface['command'] = ['vonat', 'train'];

const middleware = Composer.command(command, async (context) => {
    if (context.payload === '') {
        await context.reply('Add meg a vonatszámot, például: /vonat 1234');
        return;
    }

    if (!/^\d+$/.test(context.payload)) {
        await context.reply('A vonatszám csak szám lehet.');
        return;
    }

    const trainNumber = context.payload.toUpperCase();

    const realtimeTrains = await VonatinfoRepository.getRealtimeTrains();
    const train = realtimeTrains.find(train => train.code === trainNumber);

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
