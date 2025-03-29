import { Composer } from "telegraf";
import { MiddlewareInterface } from "./MiddlewareInterface";
import NotificationService from "../services/NotificationService";

const middleware = Composer.command(/^leiratkozas_([\d]+)$/, async (context) => {
    const notificationId = parseInt(context.match[1]);

    const notification = await NotificationService.findById(notificationId);

    if (notification === null || notification.chat.id !== context.chat.id) {
        await context.reply('Nincs ilyen értesítés.');
        return;
    }

    await NotificationService.remove(notification);
    await context.reply('Sikeresen leiratkoztál az értesítésről.');
});

export default {
    middleware,
} satisfies MiddlewareInterface;
