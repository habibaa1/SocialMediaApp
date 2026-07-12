import { model, models, Schema } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IStory } from "../../common/interfaces";
import { StoryTypeEnum } from "../../common/enums";

export type StoryDocument = HydratedDocument<IStory>;

const storySchema = new Schema<IStory>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    type: {
      type: String,
      enum: Object.values(StoryTypeEnum),
      default: StoryTypeEnum.IMAGE,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_STORIES",
  },
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

storySchema.pre(["find", "findOne"], function (this: any) {
  const filter = this.getFilter();
  if (filter.deletedAt === undefined) {
    this.where({ deletedAt: null, expiresAt: { $gt: new Date() } });
  }
});

storySchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  { document: false, query: true },
  function (this: any) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null, expiresAt: { $gt: new Date() } });
    }
  },
);

export const StoryModel = models.Story || model<IStory>("Story", storySchema);
