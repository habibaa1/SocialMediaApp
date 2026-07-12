    import { GraphQLObjectType, GraphQLSchema } from "graphql";

    import { userGQLSchema } from "../user";
    import { postGQLSchema } from "../post";

    const query = new GraphQLObjectType({
    name: "RootQueryType",

    description: "optional text to enhance understand api",

    fields: {
        ...userGQLSchema.registerQuery(),
        ...postGQLSchema.registerQuery(),
    },
    });

    const mutation = new GraphQLObjectType({
    name: "RootmutationType",

    description: "optional text to enhance understand api",

    fields: {
        ...userGQLSchema.registerMutation(),

        // add this
        ...postGQLSchema.registerMutation(),
    },
    });

    export const schema = new GraphQLSchema({
    query,
    mutation,
    });
