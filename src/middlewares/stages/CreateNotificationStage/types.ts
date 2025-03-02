import { SceneSessionData } from "telegraf/scenes";
import { Station, Train } from "../../../services/Mav";
import { EnsurePartial, StageContext } from "../types";
import { NotificationSchedule } from "../../../entities/Notification";

interface Notification {
    station: Station,
    stationTimetable: Train[],
    train: Train,
    period: NotificationSchedule,
}

interface SessionData extends SceneSessionData {
    notification: Partial<Notification>,
}

export type CreateNotificationStageContext<
    TSceneSession extends {} = {}
> = StageContext<SessionData, EnsurePartial<TSceneSession>>;

export enum SceneId {
    Entrypoint = 'CREATE_NOTIFICATION_ENTRYPOINT',
    AskForTrain = 'ASK_FOR_TRAIN',
    AskForNotificationPeriod = 'ASK_FOR_NOTIFICATION_PERIOD',
    Notification_Once_AskForDate = 'ASK_FOR_NOTIFICATION_DATE', // Only for 'once' period.
    Notification_Weekly_AskForDays = 'ASK_FOR_NOTIFICATION_DAYS', // Only for 'weekly' period.
    Notification_Weekly_AskForTime = 'ASK_FOR_NOTIFICATION_TIME', // Only for 'weekly' period.
}
