import { connect } from "mongoose";
import { DB_URI } from "../config/config";
import { UserModel } from "./model";
export const connectDB = async () =>{
    try {
        await connect(DB_URI as string,{
            serverSelectionTimeoutMS: 30000
        })
        await UserModel.syncIndexes()
        console.log("connected to DB successfully 👍")
    } catch (error) {
        console.error("error connecting to DB😒", error)
    }
}