import { MiddlewareInterface } from "./MiddlewareInterface";
import { TelegramAppContext } from '../config/telegram';
import ChatRepository from '../repositories/App/ChatRepository';

const middleware = async (context: TelegramAppContext, next: () => {}) => {
    if (context.chat === undefined) {
        return next();
    }

    const chatName = context.chat.type === 'private'
        ? context.chat.username ?? context.chat.first_name
        : context.chat.title;

    context.session.chatEntity ??= await ChatRepository.findOneBy({ id: context.chat.id})
        ?? await ChatRepository.create({
            id: context.chat.id,
            username: chatName,
        });

    return next();
};

export default {
    middleware,
} satisfies MiddlewareInterface<TelegramAppContext>;
