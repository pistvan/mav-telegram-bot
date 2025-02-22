import { Composer } from "telegraf";
import { MiddlewareInterface } from "./MiddlewareInterface.js";

const middleware = Composer.command('help', async (context) => {
    await context.reply('Szia! Én a MÁV bot vagyok, és szólni tudok neked, ha egy vonat késik.');
});

export default {
    middleware,
} satisfies MiddlewareInterface;
