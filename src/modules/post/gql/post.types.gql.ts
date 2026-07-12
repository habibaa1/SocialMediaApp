import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import { AvailabilityEnum } from "../../../common/Enums/post.enum";

export const AvailabilityGQLEnumType = new GraphQLEnumType({
  name: "AvailabilityGQLEnumType",

  values: {
    PUBLIC: {
      value: AvailabilityEnum.PUBLIC,
    },

    FRIENDS: {
      value: AvailabilityEnum.FRIENDS,
    },

    ONLY_ME: {
      value: AvailabilityEnum.ONLY_ME,
    },
  },
});

export const ReactionType = new GraphQLObjectType({
  name: "ReactionType",

  fields: {
    emoji: {
      type: GraphQLString,
    },

    userId: {
      type: GraphQLID,
    },
  },
});

export const OnePostType = new GraphQLObjectType({
  name: "OnePostType",

  fields: {
    _id: {
      type: new GraphQLNonNull(GraphQLID),
    },

    folderId: {
      type: new GraphQLNonNull(GraphQLString),
    },

    content: {
      type: GraphQLString,
    },

    attachments: {
      type: new GraphQLList(GraphQLString),
    },

    availability: {
      type: AvailabilityGQLEnumType,
    },

    likes: {
      type: new GraphQLList(GraphQLID),
    },

    tags: {
      type: new GraphQLList(GraphQLID),
    },

    reactions: {
      type: new GraphQLList(ReactionType),
    },

    updatedBy: {
      type: GraphQLID,
    },

    createdBy: {
      type: new GraphQLNonNull(GraphQLID),
    },

    deletedAt: {
      type: GraphQLString,
    },

    restoredAt: {
      type: GraphQLString,
    },

    createdAt: {
      type: GraphQLString,
    },

    updatedAt: {
      type: GraphQLString,
    },
  },
});

export const PostPaginationResponse = new GraphQLObjectType({
  name: "PostPaginationResponse",

  fields: {
    docs: {
      type: new GraphQLList(OnePostType),
    },

    currentPage: {
      type: GraphQLString,
    },

    pages: {
      type: GraphQLString,
    },

    size: {
      type: GraphQLString,
    },
  },
});

export const postList = new GraphQLObjectType({
  name: "PostListResponse",

  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },

    data: {
      type: PostPaginationResponse,
    },
  },

});




export const reactOnPost = new GraphQLObjectType({
  name: "ReactOnPostResponse",
  fields:{
    message: {
      type: new GraphQLNonNull(GraphQLString),
      
    },
    data:{type:OnePostType}


  }
});