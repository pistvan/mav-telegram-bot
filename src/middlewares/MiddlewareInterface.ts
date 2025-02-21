import { Context, Middleware } from "telegraf";

export interface CommandInterface {
    // TODO: solve, that `command` wont be exported this way
    command: string | [string, ...string[]];
    description: string;
}

export type MiddlewareInterface<C extends Context = Context> = {
    middleware: Middleware<C>;
} & (CommandInterface | {});
