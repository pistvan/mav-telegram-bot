import { EntitySchema, ValueTransformer } from "typeorm";
import { Chat, ChatEntity } from "./Chat";

export namespace NotificationPeriod {
    export type Once = {
        type: 'once',
        date: Date,
    };

    export type Weekly = {
        type: 'weekly',
        /**
         * The selected days of the week, where 0 is Sunday and 6 is Saturday.
         */
        days: number[],
        time: string,
    };
}

export type NotificationSchedule = NotificationPeriod.Once | NotificationPeriod.Weekly;

class ScheduleValueTransformer implements ValueTransformer {
    to(value: any): any {
        return JSON.stringify(value);
    }

    from(value: any): any {
        return JSON.parse(value);
    }
}

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
            transformer: new ScheduleValueTransformer(),
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
        },
    },
});
