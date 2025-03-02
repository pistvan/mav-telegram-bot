import { Markup, Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";
import { ElviraRepository, Train } from "../../../services/Mav";
import formatToTime from "../../../utils/formatToTime";
import { InlineKeyboardButton } from "telegraf/types";
import { buildChatActionMiddleware } from "../../ChatActionMiddlewareFactory";

/**
 * @internal Use regex-safe characters only.
 */
enum Action {
    PagePrevious = 'PAGE_PREVIOUS_ACTION',
    PageNext = 'PAGE_NEXT_ACTION',
    SelectTrain = 'TRAIN_SELECT_ACTION',
}

type SceneContext = CreateNotificationStageContext<{
    paginateIndex?: number,
    /**
     * The ID of the message sent by the bot.
     * When the user paginates, the bot will edit this message.
     */
    messageId?: number,
}>;

/**
 * The number of trains to show on a single page.
 */
const PAGE_LENGTH = 8;

const formatKeyboardButtonText = (train: Train, context: SceneContext): string => {
    let result = `🚂  `;

    if (train.start) {
        result += `ide: ${formatToTime(train.start)} ${train.endStation.name}`;

        // If the train starts from a different station, show it.
        if (train.startStation.code !== context.session.notification.station!.code) {
            result += ` (innen: ${train.startStation.name})`;
        }
    } else if (train.arrive) {
        result += `érkezik innen: ${formatToTime(train.arrive)} ${train.startStation.name}`;
    }

    return result;
}

const sendOrEditMessage = async (context: SceneContext) => {
    const paginateIndex = context.scene.session.paginateIndex!;
    const timetable = context.session.notification.stationTimetable!;

    const trainButtons = timetable
        .slice(paginateIndex, paginateIndex + PAGE_LENGTH)
        .map((train): InlineKeyboardButton[] => {
            return [
                Markup.button.callback(
                    formatKeyboardButtonText(train, context),
                    `${Action.SelectTrain}:${train.code}`,
                ),
            ];
        });

    // Add pagination buttons if needed.
    const paginationButtons: InlineKeyboardButton[] = [];
    if (paginateIndex > 0) {
        paginationButtons.push(
            Markup.button.callback('⬅️ Előző', Action.PagePrevious),
        );
    }
    if (paginateIndex + PAGE_LENGTH < timetable.length) {
        paginationButtons.push(
            Markup.button.callback('Következő ➡️', Action.PageNext),
        );
    }
    if (paginationButtons.length > 0) {
        trainButtons.push(paginationButtons);
    }

    if (context.scene.session.messageId) {
        await context.editMessageText('Válaszd ki a vonatot.', Markup.inlineKeyboard(trainButtons));
    } else {
        const message = await context.reply('Válaszd ki a vonatot.', Markup.inlineKeyboard(trainButtons));
        context.scene.session.messageId = message.message_id;
    }
}

const scene = new Scenes.BaseScene<SceneContext>(SceneId.AskForTrain);

scene.enter(async (context) => {
    const stationTimetable = context.session.notification.stationTimetable!;

    // Find the first train after the current time.
    const now = new Date();
    context.scene.session.paginateIndex = stationTimetable.findIndex(
        (train) => ElviraRepository.isDepartingTrain(train) ? train.start > now : train.arrive > now,
    );

    await sendOrEditMessage(context);
});

scene.action(Action.PagePrevious, async (context) => {
    context.scene.session.paginateIndex! -= PAGE_LENGTH;

    await sendOrEditMessage(context);
});

scene.action(Action.PageNext, async (context) => {
    context.scene.session.paginateIndex! += PAGE_LENGTH;

    await sendOrEditMessage(context);
});

scene.action(new RegExp(`^${Action.SelectTrain}:(?<id>\\d+)$`), buildChatActionMiddleware(), async (context) => {
    console.log(context.match);
    const trainNumber = context.match.groups!.id;

    const train = context.session.notification.stationTimetable!.find((train) => train.code === trainNumber);

    if (train === undefined) {
        throw new Error('Train not found.');
    }

    const trainStops = await ElviraRepository.getTrainStops(train.vehicleId);

    console.log(trainStops);

    const messageLines: string[] = trainStops.map((stop) => {
        let result = `🚉 `;

        if (stop.start) {
            result += `${formatToTime(stop.start)} ${stop.station.name}`;

            if (stop.arrive) {
                result += ` (érkezés: ${formatToTime(stop.arrive)})`;
            }
        } else if (stop.arrive) {
            result += `${formatToTime(stop.arrive)} ${stop.station.name}`;
        }

        return result;
    });

    await context.reply(
        [
            `Kiválasztott vonat: ${train.code}`,
            'A vonat menetrendje a következő:',
            ...messageLines,
        ].join('\n'),
    );

    context.session.notification.train = train;

    await context.scene.enter(SceneId.AskForNotificationPeriod);
});

export default scene;
