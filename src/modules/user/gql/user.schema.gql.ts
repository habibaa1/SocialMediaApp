    import { GraphQLString } from "graphql";
    import * as UserGQLTypes from "./user.types.gql";
    import * as UserGQLArgs from "./user.args.gql";
    import { UserResolver } from "./user.resolver";
    export class UserGQLSchema {
    private userResolver: UserResolver;
    constructor() {
        this.userResolver = new UserResolver();
    }

    registerQuery() {
        return {
        Profile: {
            type: UserGQLTypes.profileType,
            description: "test profile point",
            args: UserGQLArgs.profile,
            resolve: this.userResolver.profile,
        },
        };
    }

    registerMutation() {
        return {
        like: {
            type: GraphQLString,
            description: "test welcome point",
            resolve: () => {
            return "Hi there! Welcome to our API.";
            },
        },
        };
    }
    }

    export const userGQLSchema = new UserGQLSchema();
