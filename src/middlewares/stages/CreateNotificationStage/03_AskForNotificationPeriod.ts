import { Markup, Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";

type PeriodType = Required<CreateNotificationStageContext['session']['notification']>['period']['type'];

const PeriodTypeLabels = {
    once: 'Egy alkalommal',
    weekly: 'Rendszeresen',
} as const satisfies Record<PeriodType, string>;

const ACTION = 'SELECT_PERIOD';

const PeriodTypeSceneIds = {
    once: SceneId.Notification_Once_AskForDate,
    weekly: SceneId.Notification_Weekly_AskForDays,
} as const satisfies Record<PeriodType, SceneId>;

const scene = new Scenes.BaseScene<CreateNotificationStageContext>(SceneId.AskForNotificationPeriod);

scene.enter(async (context) => {
    const keyboard = [
        Object.entries(PeriodTypeLabels).map(([type, label]) => {
            return Markup.button.callback(label, `${ACTION}:${type}`);
        }),
    ];

    await context.reply(`Milyen gyakran szeretnél értesítést kapni?`, {
        reply_markup: {
            //inline_keyboard: keyboard,
            keyboard,
            is_persistent: true,
            one_time_keyboard: true,
            resize_keyboard: true,
        },
    });
});

scene.action(new RegExp(`^${ACTION}:(?<type>.+)$`), async (context) => {
    const type = context.match.groups!.type as PeriodType;

    if (!(type in PeriodTypeLabels)) {
        await context.reply('Hibás időszak típus.');
        await context.scene.leave();
        return;
    }

    await context.scene.enter(PeriodTypeSceneIds[type]);
});

scene.on('text', async (context, next) => {
    const type = (Object.keys(PeriodTypeLabels) as PeriodType[]).find(
        (type) => PeriodTypeLabels[type] === context.message.text
    );

    if (type === undefined) {
        return next();
    }

    await context.scene.enter(PeriodTypeSceneIds[type]);
});

export default scene;
