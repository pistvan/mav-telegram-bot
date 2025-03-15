import { Context } from "telegraf";
import { Chat } from "../entities/Chat";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (botToken === undefined) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const adminChatIds: number[] = (() => {
    const concated = process.env.TELEGRAM_ADMIN_CHAT_IDS?.trim() ?? '';
    if (concated === '') {
        return [];
    }
    const splitted = concated.split(',');

    const regex = /^\d+$/;
    for (const id of splitted) {
        if (!regex.test(id)) {
            throw new Error(`Invalid chat ID: ${id}`);
        }
    }

    return splitted.map(Number);
})();

export type TelegramAppContext = Context & {
    session: {
        chatEntity: Chat,
    },
}

export default {
    botToken,
    /**
     * The chat IDs of the administrators.
     *
     * Can be used to report errors.
     */
    adminChatIds,
};
