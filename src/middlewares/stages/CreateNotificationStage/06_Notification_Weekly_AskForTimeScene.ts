import { Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";
import { DateTime } from "luxon";
import { NotificationPeriod } from "../../../entities/Notification";
import NotificationRepository from "../../../repositories/App/NotificationRepository.js";

const DATE_FORMAT = `HH:mm`;

const TimeRegex = /^(?<hour>\d|[01]\d|2[0123]):(?<minute>[012345]\d)$/;

const scene = new Scenes.BaseScene<CreateNotificationStageContext>(SceneId.Notification_Weekly_AskForTime);

scene.enter(async (context) => {
    await context.reply([
        `Pontosan hány órakor szeretnéd megkapni az értesítést?`,
        `Ezt a következő formátumban add meg: ${DateTime.now().toFormat(DATE_FORMAT)}`,
    ].join(`\n`));
});

scene.on(`text`, async (context) => {
    const match = TimeRegex.exec(context.message.text);

    if (!match) {
        await context.reply(`Hibás formátum!`);
        return;
    }

    const notificationPeriod = context.session.notification.period as NotificationPeriod.Weekly;

    notificationPeriod.time = context.message.text;

    const notification = await NotificationRepository.save({
        train: context.session.notification.train!.code,
        schedule: notificationPeriod,
        chat: context.session.chatEntity,
    });

    console.log(`The notification has been saved:`, notification);

    await context.scene.leave();
});

export default scene;