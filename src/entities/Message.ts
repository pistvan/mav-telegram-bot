import { EntitySchema } from "typeorm";
import { ChatEntity } from "./Chat.js";

export interface Message {
    id: number;
    chat: number;
    text: string;
}

export const MessageEntity = new EntitySchema<Message>({
    name: 'message',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        text: {
            type: 'text',
        },
    },
    relations: {
        chat: {
            type: 'many-to-one',
            target: ChatEntity,
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        },
    },
});
