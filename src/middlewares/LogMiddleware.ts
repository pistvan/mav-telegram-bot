import { Composer } from "telegraf";
import { MiddlewareInterface } from "./MiddlewareInterface";

const middleware = Composer.optional(() => true, async (context, next) => {
    console.log(context.update);

    try {
        await next();
    } catch (error) {
        console.error(error);
    }
});

export default {
    middleware,
} satisfies MiddlewareInterface;
