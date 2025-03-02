import { Context, MiddlewareFn, Telegram } from "telegraf";

/**
 * Returns a middleware that sends a chat action, after a delay.
 * Combine with long-running middleware to indicate progress.
 *
 * @param action - The chat action to send.
 */
export function buildChatActionMiddleware<C extends Context>(
    action: Parameters<Telegram['sendChatAction']>[1] = 'typing',
): MiddlewareFn<C> {
    return async (context, next) => {
        await context.sendChatAction(action);
        return next();
    };
}
