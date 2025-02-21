import DataSource from "./data-source.js";
import telegramConfig from "./config/telegram.js";
import { Telegraf } from "telegraf";
import StationCommand from './middlewares/StationCommand.js';
import TrainComand from './middlewares/TrainCommand.js';

await DataSource.initialize();

const bot = new Telegraf(telegramConfig.botToken);

// Here we define all the middlewares that we want to use.
const commands = [
    StationCommand,
    TrainComand,
] as const;

// Register all the middlewares.
bot.use(...commands.map(c => c.middleware));

// Register the middlewares, that are bot commands as well.
bot.telegram.setMyCommands(
    commands
        .filter(c => 'command' in c)
        .map(c => ({
            command: Array.isArray(c.command) ? c.command[0] : c.command,
            description: c.description,
        }))
);
bot.on('message', async (context) => {
    if (context.chat.type !== 'private') {
        await context.reply('Jelenleg csak privát üzeneteket kezelek.');
        await context.leaveChat();
        return;
    }

    console.log(context.message);
    await context.reply('Hello World!');
});

bot.launch();

// Enable graceful stop
// TODO: test
process.once('SIGINT', () => bot.stop('graceful shutdown'))
process.once('SIGTERM', () => bot.stop('graceful shutdown'))
