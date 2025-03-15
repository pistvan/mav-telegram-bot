import { Format } from "telegraf";

export interface MessageServiceInterface {
    sendMessage(chatId: number, message: string | Format.FmtString): Promise<void>;

    /**
     * Notifies the administrator about an error.
     */
    reportError(error: unknown): Promise<void>;
}
