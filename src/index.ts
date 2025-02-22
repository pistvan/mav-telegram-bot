import DataSource from "./data-source.js";
import telegramConfig from "./config/telegram.js";
import { Context, Telegraf } from "telegraf";
import StationCommand from './middlewares/StationCommand.js';
import TrainComand from './middlewares/TrainCommand.js';
import StartCommand from "./middlewares/StartCommand.js";
import HelpCommand from "./middlewares/HelpCommand.js";
import { Update } from "telegraf/types";
import CacheManager from '@type-cacheable/core';
import NodeCache from 'node-cache';
import { useAdapter } from '@type-cacheable/node-cache-adapter';

CacheManager.setClient(useAdapter(new NodeCache()));

const bot = new Telegraf(telegramConfig.botToken);

// Here we define all the middlewares that we want to use.
const middlewares = [
    StartCommand,
    HelpCommand,
    StationCommand,
    TrainComand,
] as const;

// Register all the middlewares.
bot.use(...middlewares.map(c => c.middleware));

// Register the middlewares, that are bot commands as well.
bot.telegram.setMyCommands(
    middlewares
        .filter(c => 'command' in c)
        .map(c => ({
            command: Array.isArray(c.command) ? c.command[0] : c.command,
            description: c.description,
        }))
);
bot.on('message', async (context) => {
    const getChatName = (chat: Context<Update.MessageUpdate>['chat']): string => chat.type === 'private'
        ? chat.username ?? chat.first_name
        : chat.title;

    console.log(context.message);
    await context.reply('Hello World!');
});

DataSource.initialize()
    .then(() => {
        bot.launch();
        console.log('Listening...');
    });

// Enable graceful stop
// TODO: test
process.once('SIGINT', () => bot.stop('graceful shutdown'))
process.once('SIGTERM', () => bot.stop('graceful shutdown'))
