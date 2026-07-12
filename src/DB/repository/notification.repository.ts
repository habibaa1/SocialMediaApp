import { INotification } from "../../common/interfaces";
import { NotificationModel } from "../model/notification.model";
import { BaseRepository } from "./base.reposatory";

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }
}
