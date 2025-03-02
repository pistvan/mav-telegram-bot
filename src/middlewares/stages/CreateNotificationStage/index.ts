import { Scenes } from "telegraf";
import { CreateNotificationStageContext } from "./types.js";
import Scene_01_AskForStationNameScene from "./01_AskForStationNameScene.js";
import Scene_02_AskForTrainScene from "./02_AskForTrainScene.js";
import Scene_03_AskForNotificationPeriod from "./03_AskForNotificationPeriod.js";
import Scene_04_Notification_Once_AskForDate from "./04_Notification_Once_AskForDate.js";
import Scene_05_Notification_Weekly_AskForDays from "./05_Notification_Weekly_AskForDays.js";
import Scene_06_Notification_Weekly_AskForTimeScene from "./06_Notification_Weekly_AskForTimeScene.js"

const stage = new Scenes.Stage<CreateNotificationStageContext>([
    Scene_01_AskForStationNameScene,
    Scene_02_AskForTrainScene,
    Scene_03_AskForNotificationPeriod,
    Scene_04_Notification_Once_AskForDate,
    Scene_05_Notification_Weekly_AskForDays,
    Scene_06_Notification_Weekly_AskForTimeScene,
]);

export default stage.middleware();
