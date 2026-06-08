import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";

export interface IUser{
    firstName:string;
    lastName:string;
    username?:string;
    email:string;
    password:string;
    bio?:string;
    phone?:string;
    profileImage?:string;
    slug:string;
    coverImages?:string[];
    DOB?:Date;
    confirmEmail?:Date;
    confirmedAt?:Date;
    changeCredentialsTime:Date;
    gender:GenderEnum;
    role:RoleEnum;
    provider:ProviderEnum;
    friends?:Types.ObjectId[]| IUser[];

    createdAt:Date;
    updatedAt?:Date;
    deletedAt?:Date;
    restoredAt:Date;
    extra:{
        name:string;
    }

}