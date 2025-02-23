import { DataSource } from "typeorm";
import { ChatEntity } from "./entities/Chat";
import { MessageEntity } from "./entities/Message";

export default new DataSource({
    type: 'sqlite',
    database: '../storage/database.sqlite', // TODO: use process.env
    entities: [
        // TODO: use directory
        ChatEntity,
        MessageEntity,
    ],
});
