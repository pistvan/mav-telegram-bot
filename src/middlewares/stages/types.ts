import { Context } from "telegraf";
import { SceneContextScene, SceneSession, SceneSessionData } from "telegraf/scenes";
import { TelegramAppContext } from "../../config/telegram";

/**
 * A type that enforces the given type to be a partial type.
 */
export type EnsurePartial<T extends {}> = {} extends T ? T : never;

/**
 * An interface for stages, providing a global and scene-specific session.
 *
 * @template TSceneSession The scene-specific session type.
 * Must be a partial type, when declaring scenes!
 * This is because all scene interface must be assignable to the stage scene interface.
 * You the `EnsurePartial` type above, to ensure this.
 */
export type StageContext<
    TSession extends {} = {},
    TSceneSession extends {} = {},
> = Context & TelegramAppContext & {
    session: TSession & SceneSession<EnsurePartial<TSceneSession> & SceneSessionData>,
    scene: SceneContextScene<StageContext<TSession, EnsurePartial<TSceneSession>>, EnsurePartial<TSceneSession> & SceneSessionData>,
}
