import { DataSource } from "typeorm";
import { ChatEntity } from "./entities/Chat";
import { MessageEntity } from "./entities/Message";
import { NotificationEntity } from "./entities/Notification";

export default new DataSource({
    type: 'sqlite',
    database: '../storage/database.sqlite', // TODO: use process.env
    entities: [
        // TODO: use directory
        ChatEntity,
        MessageEntity,
        NotificationEntity,
    ],
});
