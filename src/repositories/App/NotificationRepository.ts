import dataSource from "../../data-source.js";
import { Notification, NotificationEntity } from "../../entities/Notification.js";

const repository = dataSource.getRepository<Notification>(NotificationEntity);

export default repository;
