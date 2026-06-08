import { IUser } from "../../common/interfaces";
import { BaseRepository } from "./base.reposatory";
import {UserModel} from "../model/user.model";
export class UserRepository extends  BaseRepository<IUser> {
        constructor() {
            super(UserModel)
        }
        
}
