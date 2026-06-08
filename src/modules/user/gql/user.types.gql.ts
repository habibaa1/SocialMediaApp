import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../../common/enums/user.enum";
export const GenderGQLEnumType = new GraphQLEnumType({
    name:"GenderGQLEnumType",
    values:{
        MALE:{value:GenderEnum.MALE},
        FEMALE:{value:GenderEnum.FEMALE},
    }
}) 
export const ProviderGQLEnumType = new GraphQLEnumType({
    name:"ProviderGQLEnumType",
    values:{
        GOOGLE:{value:ProviderEnum.GOOGLE},
        SYSTEM:{value:ProviderEnum.SYSTEM},
    }
}) 
export const RoleGQLEnumType = new GraphQLEnumType({
    name:"RoleGQLEnumType",
    values:{
        ADMIN:{value:RoleEnum.ADMIN},
        USER:{value:RoleEnum.USER},
    }
}) 
export const OneUserType: GraphQLObjectType = new GraphQLObjectType({
    name: "OneUserType",
    fields:()=>({ 
                _id: { type: new GraphQLNonNull(GraphQLID) },
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                lastName: { type: new GraphQLNonNull(GraphQLString) },
                slug: { type: new GraphQLNonNull(GraphQLString) },
                username: { type: GraphQLString },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: GraphQLString },
                phone: { type: GraphQLString },
                profilePicture: { type: GraphQLString },
                profileCoverPictures: { type: new GraphQLList(GraphQLString) },
                DOB: { type: GraphQLString },
                deletedAt: { type: GraphQLString },
                restoredAt: { type: GraphQLString },
                confirmEmail: { type: GraphQLString },
                changeCredentialsTime: { type: GraphQLString },
                createdAt: { type: new GraphQLNonNull(GraphQLString) },
                updatedAt: { type: GraphQLString },

                gender: { type: GenderGQLEnumType },
                provider: { type: ProviderGQLEnumType },
                role: { type: RoleGQLEnumType },  
                friends: { type: new GraphQLList(OneUserType) } 
        
    })
})
    
export const profile = new GraphQLNonNull(new GraphQLObjectType({
    name: "ProfileResponse",
    description: "",
    fields: {
        message: { type: new GraphQLNonNull(GraphQLString) },
        data: { type: OneUserType }
    }
}))