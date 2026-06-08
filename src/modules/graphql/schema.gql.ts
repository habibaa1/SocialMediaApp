    import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGQLSchema } from "../user";

    const  query = new GraphQLObjectType({
        name: "RootSchemaQuery",
        description: "optional text t enhance understand api",
        fields: {
            ...userGQLSchema.registerQuery()
        }
    });

    const mutation = new GraphQLObjectType({
        name: "RootSchemaMutation",
        description: "optional text t enhance understand api",
        fields: {
            ...userGQLSchema.registerMutation()
        }
    })
    export const schema = new GraphQLSchema({ query, mutation });