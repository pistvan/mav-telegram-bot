import telegramConfig from "../config/telegram";
import { Telegram, Format } from "telegraf";
import { MessageServiceInterface } from "./MessageServiceInterface";

export class MessageService implements MessageServiceInterface {
    public constructor(
        protected telegram: Telegram,
        protected adminChatIds: number[],
    ) {
    }

    public async sendMessage(chatId: number, message: string | Format.FmtString): Promise<void> {
        await this.telegram.sendMessage(chatId, message);
    }

    public async reportError(error: unknown): Promise<void> {
        const errorMessage = this.getErrorMessage(error);

        const message = Format.join([
            Format.fmt(`❌ Hiba történt:`),
            Format.code(errorMessage),
        ], `\n`);

        for (const chatId of this.adminChatIds) {
            await this.sendMessage(chatId, message);
        }
    }

    protected getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return `${error.stack ?? error.message}`;
        }

        return String(error);
    }
}

export default new MessageService(
    new Telegram(telegramConfig.botToken),
    telegramConfig.adminChatIds,
);
