import {Types} from "mongoose";
export const toObjectId = (id: string): Types.ObjectId => {
    return Types.ObjectId.createFromHexString(id);
}