import { EntitySchema } from "typeorm";
import { Chat, ChatEntity } from "./Chat";
import typeormJsonTransformer from "../utils/typeormJsonTransformer";

export namespace NotificationPeriod {
    export type Once = {
        type: 'once',
        /**
         * @internal Cannot use Date because it is not serializable.
         */
        date: string,
    };

    export type Weekly = {
        type: 'weekly',
        /**
         * The selected days of the week, where 0 is Sunday and 6 is Saturday.
         */
        days: number[],
        /**
         * @format hh:mm
         */
        time: string,
    };
}

export type NotificationSchedule = NotificationPeriod.Once | NotificationPeriod.Weekly;

export interface Notification {
    id: number,
    train: string,
    schedule: NotificationSchedule,
    chat: Chat,
    createdAt: Date,
    updatedAt: Date,
}

export const NotificationEntity = new EntitySchema<Notification>({
    name: 'notification',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        train: {
            type: String,
        },
        schedule: {
            type: String,
            transformer: typeormJsonTransformer,
        },
        createdAt: {
            type: 'datetime',
            createDate: true,
        },
        updatedAt: {
            type: 'datetime',
            updateDate: true,
        },
    },
    relations: {
        chat: {
            type: 'many-to-one',
            target: ChatEntity,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            eager: true,
        },
    },
});
