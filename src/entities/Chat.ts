import { EntitySchema } from "typeorm";

export interface Chat {
    id: number;
    username?: string;
    createdAt: Date;
}

export const ChatEntity = new EntitySchema<Chat>({
    name: 'chat',
    columns: {
        id: {
            type: Number,
            primary: true,
        },
        username: {
            type: 'varchar',
            nullable: true,
        },
        createdAt: {
            type: 'datetime',
            createDate: true,
        },
    },
});
