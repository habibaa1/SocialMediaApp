import { UserService } from "../user.service";
import { HydratedDocument } from "mongoose";
import { IUser } from "../../../common/interfaces";    

export class UserResolver {
    private userService: UserService;
    constructor() {
        this.userService = new UserService()
    }


    profile = async (parent: unknown, args: { search?: string }) => {

        const data = await this.userService.profile({}as HydratedDocument<IUser>)

        return {message:`Hello`, data};

    }
}

export const userResolver = new UserResolver()