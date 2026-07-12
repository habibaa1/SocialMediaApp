import { model, models, Schema, Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IChat, IMessage } from "../../common/interfaces";
import { ChatEnum } from "../../common/enums";


export type chatDocument = HydratedDocument<IChat>;
  
const messageSchema = new Schema<IMessage>({
  content: {
    type: String, required: function (this) {
    return !this.attachments?.length
    }
  },

  attachments: { type: [String] },
  likes: [{ type: Types.ObjectId, ref: "User" }],
  tags: [{ type: Types.ObjectId, ref: "User" }],

  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
  restoredAt: { type: Date },
  updatedAt: { type: Date }
})

const chatSchema = new Schema<IChat>({
  participants: [{ type: Types.ObjectId, ref: "User" }],
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  messages: {type :[messageSchema], required: true},
  type: { type: String, enum: ChatEnum, required: true },
  group: { type: String },
  group_image: { type: String },
  roomId: { type: String },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
  restoredAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: "SOCIAL_APP_CHATS"
})

chatSchema.pre(["find", "findOne", "findOneAndUpdate"], function (this: any) {
  if (!this.getFilter) {
    return;
  }
  const filter = this.getFilter();
  if (filter?.deletedAt === undefined) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});
chatSchema.pre("updateOne", function (this: any) {
  if (!this.getFilter) {
    return;
  }     

  const filter = this.getFilter();
  if (filter?.deletedAt === undefined) {
    this.setQuery({ ...filter, deletedAt: null });
  }


});
chatSchema.pre("findOneAndUpdate", function (this: any) {
  if (!this.getFilter) {
    return;
  } 
  const filter = this.getFilter();
  if (filter?.deletedAt === undefined) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});


export const chatModel = models.chat || model<IChat>("chat", chatSchema);
