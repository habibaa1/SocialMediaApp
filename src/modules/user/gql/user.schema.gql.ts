import { GraphQLString} from "graphql";
import * as UserGQLTypes from "./user.types.gql";
import * as UserGQLArgs from "./eser.args.gql";
import { UserResolver } from "./user.resolver";


export class UserGQLSchema{
    private userResolver:UserResolver;
    constructor(){
        this.userResolver = new UserResolver()
    }

    registerQuery(){
        return{
                    profile: {
                        type: UserGQLTypes.profile, 
                        args: UserGQLArgs.profile,
                        description: "test profile point 2",
                        resolve: this.userResolver.profile 
                    },
                    welcome2: {
                        type: UserGQLTypes.profile, 
                        description: "test profile point 2",
                        resolve: () => {
            
                        return `Helloo`;
                        }
                    }
        }
    }

    registerMutation(){
        return {
                    like: {
                        type: GraphQLString, 
                        description: "test like point 2",
                        resolve: () => {
            
                        return `Hello`;
                        }
                    }
        }
    }
}
export const userGQLSchema = new UserGQLSchema()