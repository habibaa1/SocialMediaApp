    import {
    GraphQLEnumType,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
    } from "graphql";

    import { GenderEnum, ProviderEnum, RoleEnum } from "../../../common/enums";
    import { HydratedDocument } from "mongoose";
    import { IUser } from "../../../common/interfaces";

    export const GenderGQLEnumType = new GraphQLEnumType({
    name: "GenderGQLEnumType",

    values: {
        Male: {
        value: GenderEnum.MALE,
        },

        Female: {
        value: GenderEnum.FEMALE,
        },
    },
    });

    export const ProviderGQLEnumType = new GraphQLEnumType({
    name: "ProviderGQLEnumType",

    values: {
        Google: {
        value: ProviderEnum.GOOGLE,
        },

        System: {
        value: ProviderEnum.SYSTEM,
        },
    },
    });

    export const RoleGQLEnumType = new GraphQLEnumType({
    name: "RoleGQLEnumType",

    values: {
        Admin: {
        value: RoleEnum.ADMIN,
        },

        User: {
        value: RoleEnum.USER,
        },
    },
    });

    export const profileType = new GraphQLNonNull(
    new GraphQLObjectType({
        name: "ProfileResponse",

        description: "",

        fields: {
        message: {
            type: new GraphQLNonNull(GraphQLString),
        },

        data: {
            type: new GraphQLObjectType({
            name: "OneUserType",

            fields: {
                _id: {
                type: GraphQLID,
                
                },

                firstName: {
                type: new GraphQLNonNull(GraphQLString),
                },

                lastName: {
                type: new GraphQLNonNull(GraphQLString),
                },

                slug: {
                type: new GraphQLNonNull(GraphQLString),
                },

                username: {
                type: GraphQLString,
                resolve: (parent: HydratedDocument<IUser>) =>{
                    console.log({parent})
                    return parent.username
                }
                },

                email: {
                type: new GraphQLNonNull(GraphQLString),
                },

                password: {
                type: GraphQLString,
                },

                phone: {
                type: GraphQLString,
                },

                profilePicture: {
                type: GraphQLString,
                },

                profileCoverPictures: {
                type: new GraphQLList(GraphQLString),
                },

                DOB: {
                type: GraphQLString,
                },

                deletedAt: {
                type: GraphQLString,
                },

                restoredAt: {
                type: GraphQLString,
                },

                confirmEmail: {
                type: GraphQLString,
                },

                changeCredentialsTime: {
                type: GraphQLString,
                },

                createdAt: {
                type: new GraphQLNonNull(GraphQLString),
                },

                updatedAt: {
                type: GraphQLString,
                },

                gender: {
                type: GenderGQLEnumType,
                },

                provider: {
                type: ProviderGQLEnumType,
                },

                role: {
                type: RoleGQLEnumType,
                },

                friends: {
                type: new GraphQLList(
                    new GraphQLObjectType({
                    name: "FriendType",

                    fields: {
                        _id: { type: GraphQLID },

                        firstName: {
                        type: GraphQLString,
                        },

                        lastName: {
                        type: GraphQLString,
                        },

                        email: {
                        type: GraphQLString,
                        },
                    },
                    }),
                ),
                },
            },
            }),
        },
        },
    }),
    );
