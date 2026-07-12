import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";

export const ReactGQLEnumType = new GraphQLEnumType({
  name: "ReactEnum",

  values: {
    LIKE: {
      value: 1,
    },

    DISLIKE: {
      value: 0,
    },
  },
});

export const postList = {
  page: {
    type: GraphQLInt,
  },

  size: {
    type: GraphQLInt,
  },

  search: {
    type: GraphQLString,
  },
};

export const reactOnPost = {
  postID: {
    type: new GraphQLNonNull(GraphQLID),
  },

  react: {
    type: new GraphQLNonNull(ReactGQLEnumType),
  },
};
