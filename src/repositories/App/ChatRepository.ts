import dataSource from "../../data-source.js";
import { Chat, ChatEntity } from "../../entities/Chat.js";

const repository = dataSource.getRepository<Chat>(ChatEntity);

export default repository;
