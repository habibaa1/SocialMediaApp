import { UserService } from "../user.service";
import { BadRequestExaption } from "../../../common/exception";

export class UserResolver {
    private userService: UserService;
    constructor() {
        this.userService = new UserService()
    }


    profile = async (parent: unknown, args: { search?: string }) => {

        if (!args.search) {
            throw new BadRequestExaption("User ID is required");
        }

        const data = await this.userService.profile(args.search);

        return {message:`Hello`, data};

    }
}

export const userResolver = new UserResolver()
