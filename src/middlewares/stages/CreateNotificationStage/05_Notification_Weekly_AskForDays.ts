import { Markup, Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";
import { InlineKeyboardButton, Convenience } from "telegraf/types";
import chunkArray from "../../../utils/chunkArray";
import { NotificationPeriod } from "../../../entities/Notification";
import { DaysOfTheWeek } from "../../../services/NotificationService";

type SceneContext = CreateNotificationStageContext<{
    messageId?: number,
}>;

enum Action {
    ToggleDay = 'TOGGLE_DAY',
    Done = 'DONE',
}

const scene = new Scenes.BaseScene<SceneContext>(SceneId.Notification_Weekly_AskForDays);

const sendOrEditMessage = async (context: SceneContext) => {
    let notificationPeriod = context.session.notification.period as NotificationPeriod.Weekly;

    // The keyboard buttons for the days of the week, and the submit button, in a 2-column layout.
    const inline_keyboard: InlineKeyboardButton[][] = chunkArray([
        ...DaysOfTheWeek.map((day, index) => Markup.button.callback(
            notificationPeriod.days.includes(index) ? `✅ ${day}` : `❌ ${day}`,
            `${Action.ToggleDay}:${index}`
        )),
        // If any day is selected, then show the "Done" button.
        ...(notificationPeriod.days.length > 0
            ? [Markup.button.callback(`Kész`, Action.Done)]
            : []
        ),
    ], 2);

    const options: Convenience.ExtraReplyMessage & Convenience.ExtraEditMessageText = {
        reply_markup: {
            inline_keyboard,
        },
    }

    if (context.scene.session.messageId) {
        await context.editMessageText(`Mely napokon szeretnél értesítést kapni?`, options);
    } else {
        const message = await context.reply(`Mely napokon szeretnél értesítést kapni?`, options);

        context.scene.session.messageId = message.message_id;
    }
}

scene.enter(async (context) => {
    context.session.notification.period = {
        type: `weekly`,
        days: [],
        time: '',
    };

    await sendOrEditMessage(context);
});

scene.action(new RegExp(`^${Action.ToggleDay}:(\\d+)$`), async (context) => {
    const index = parseInt(context.match[1]);

    if (isNaN(index) || index < 0 || index >= DaysOfTheWeek.length) {
        await context.reply(`Hibás nap index.`);
        return;
    }

    const notificationPeriod = context.session.notification.period as NotificationPeriod.Weekly;

    if (notificationPeriod.days.includes(index)) {
        // Remove the day from the list.
        notificationPeriod.days = notificationPeriod.days.filter((day) => day !== index);
    } else {
        // Add the day to the list, then sort.
        notificationPeriod.days.push(index);
        notificationPeriod.days.sort();
    }

    await sendOrEditMessage(context);
});

scene.action(Action.Done, async (context) => {
    // TODO: check if at least one day is selected.

    await context.scene.enter(SceneId.Notification_Weekly_AskForTime);
});

export default scene;