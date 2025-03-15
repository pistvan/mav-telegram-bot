import { Composer, Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";
import { DateTime } from "luxon";
import NotificationService from "../../../services/NotificationService";

const DATE_FORMAT = `yyyy-MM-dd HH:mm`;

const scene = new Scenes.BaseScene<CreateNotificationStageContext>(SceneId.Notification_Once_AskForDate);

scene.enter(async (context) => {
    await context.reply([
        `Mikor szeretnél értesítést kapni a vonatról?`,
        `Írd be a dátumot és az időt a következő formátumban:`,
        DateTime.now().toFormat(DATE_FORMAT),
    ].join(`\n`), {
        reply_markup: {
            remove_keyboard: true,
        },
    });
});

scene.on('text', async (context) => {
    const date = DateTime.fromFormat(context.message.text, DATE_FORMAT);

    if (!date.isValid) {
        await context.reply(`Hibás dátum formátum. Próbáld újra.`);
        return;
    }

    const notification = await NotificationService.create({
        train: context.session.notification.train!.code,
        schedule: {
            type: `once`,
            date: date.toISO(),
        },
        chat: context.session.chatEntity,
    });

    console.log(`The notification has been saved:`, notification);

    await context.scene.leave();
});

// Drop every other update.
scene.use(Composer.optional(() => true, scene.enterMiddleware()));

export default scene;
