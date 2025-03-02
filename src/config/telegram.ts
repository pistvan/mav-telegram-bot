import { Context } from "telegraf";
import { Chat } from "../entities/Chat";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (botToken === undefined) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

export type TelegramAppContext = Context & {
    session: {
        chatEntity: Chat,
    },
}

export default {
    botToken,
};
