import DataSource from "./data-source";
import telegramConfig, { TelegramAppContext } from "./config/telegram";
import { Context, session, Telegraf } from "telegraf";
import LogMiddleware from "./middlewares/LogMiddleware";
import HydrateSessionWithChatEntityMiddleware from "./middlewares/HydrateSessionWithChatEntityMiddleware";
import StationCommand from './middlewares/StationCommand';
import TrainComand from './middlewares/TrainCommand';
import StartCommand from "./middlewares/StartCommand";
import HelpCommand from "./middlewares/HelpCommand";
import LocationMiddleware from "./middlewares/LocationMiddleware";
import { Update } from "telegraf/types";
import CacheManager from '@type-cacheable/core';
import NodeCache from 'node-cache';
import { useAdapter } from '@type-cacheable/node-cache-adapter';
import CreateNotificationStageMiddleware from './middlewares/stages/CreateNotificationStage';
import { MiddlewareInterface } from "./middlewares/MiddlewareInterface";

CacheManager.setClient(useAdapter(new NodeCache()));

const bot = new Telegraf<TelegramAppContext>(telegramConfig.botToken);

// Here we define all the middlewares that we want to use.
const middlewares = [
    { middleware: session({ defaultSession: () => ({}) }) },
    HydrateSessionWithChatEntityMiddleware,
    LogMiddleware,
    CreateNotificationStageMiddleware,
    StartCommand,
    HelpCommand,
    StationCommand,
    TrainComand,
    LocationMiddleware,
] as const;

// Register all the middlewares.
bot.use(...middlewares.map(m => (m as MiddlewareInterface).middleware));

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
