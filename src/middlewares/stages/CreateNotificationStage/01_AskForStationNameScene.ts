import { Composer, Scenes } from "telegraf";
import { CreateNotificationStageContext, SceneId } from "./types";
import { ElviraRepository } from "../../../services/Mav";
import { DateTime } from "luxon";
import * as MavConfig from "../../../services/Mav/config";
import { buildChatActionMiddleware } from "../../ChatActionMiddlewareFactory";

const scene = new Scenes.BaseScene<CreateNotificationStageContext>(SceneId.Entrypoint);

scene.enter(async (context) => {
    context.session.notification = {};
    await context.reply('Adj meg egy állomást, ahol a vonat megáll.');
});

scene.on('text', buildChatActionMiddleware(), async (context) => {
    const station = await ElviraRepository.getStationByName(context.message.text);

    if (station === undefined) {
        await context.reply('Nem találtam ilyen állomást. Kérlek, próbáld újra.');
        return;
    }

    // Get the timetable for today and tomorrow. The user can paginate through these records.
    const startOfToday = DateTime.now().setZone(MavConfig.ElviraTimezone).startOf('day').toJSDate();
    const stationTimetable = await ElviraRepository.getStationTimetable({
        station,
        date: startOfToday,
        hours: 48,
    });

    context.session.notification = {
        station,
        stationTimetable,
    };

    return context.scene.enter(SceneId.AskForTrain);
});

// Drop every other update.
scene.use(Composer.optional(() => true, scene.enterMiddleware()));

export default scene;
