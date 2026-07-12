"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnPost = exports.postList = exports.PostPaginationResponse = exports.OnePostType = exports.ReactionType = exports.AvailabilityGQLEnumType = void 0;
const graphql_1 = require("graphql");
const post_enum_1 = require("../../../common/Enums/post.enum");
exports.AvailabilityGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "AvailabilityGQLEnumType",
    values: {
        PUBLIC: {
            value: post_enum_1.AvailabilityEnum.PUBLIC,
        },
        FRIENDS: {
            value: post_enum_1.AvailabilityEnum.FRIENDS,
        },
        ONLY_ME: {
            value: post_enum_1.AvailabilityEnum.ONLY_ME,
        },
    },
});
exports.ReactionType = new graphql_1.GraphQLObjectType({
    name: "ReactionType",
    fields: {
        emoji: {
            type: graphql_1.GraphQLString,
        },
        userId: {
            type: graphql_1.GraphQLID,
        },
    },
});
exports.OnePostType = new graphql_1.GraphQLObjectType({
    name: "OnePostType",
    fields: {
        _id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
        },
        folderId: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        content: {
            type: graphql_1.GraphQLString,
        },
        attachments: {
            type: new graphql_1.GraphQLList(graphql_1.GraphQLString),
        },
        availability: {
            type: exports.AvailabilityGQLEnumType,
        },
        likes: {
            type: new graphql_1.GraphQLList(graphql_1.GraphQLID),
        },
        tags: {
            type: new graphql_1.GraphQLList(graphql_1.GraphQLID),
        },
        reactions: {
            type: new graphql_1.GraphQLList(exports.ReactionType),
        },
        updatedBy: {
            type: graphql_1.GraphQLID,
        },
        createdBy: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
        },
        deletedAt: {
            type: graphql_1.GraphQLString,
        },
        restoredAt: {
            type: graphql_1.GraphQLString,
        },
        createdAt: {
            type: graphql_1.GraphQLString,
        },
        updatedAt: {
            type: graphql_1.GraphQLString,
        },
    },
});
exports.PostPaginationResponse = new graphql_1.GraphQLObjectType({
    name: "PostPaginationResponse",
    fields: {
        docs: {
            type: new graphql_1.GraphQLList(exports.OnePostType),
        },
        currentPage: {
            type: graphql_1.GraphQLString,
        },
        pages: {
            type: graphql_1.GraphQLString,
        },
        size: {
            type: graphql_1.GraphQLString,
        },
    },
});
exports.postList = new graphql_1.GraphQLObjectType({
    name: "PostListResponse",
    fields: {
        message: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        data: {
            type: exports.PostPaginationResponse,
        },
    },
});
exports.reactOnPost = new graphql_1.GraphQLObjectType({
    name: "ReactOnPostResponse",
    fields: {
        message: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        data: { type: exports.OnePostType }
    }
});
