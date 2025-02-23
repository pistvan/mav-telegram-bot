import dataSource from "../../data-source";
import { Chat, ChatEntity } from "../../entities/Chat";

const repository = dataSource.getRepository<Chat>(ChatEntity);

export default repository;
