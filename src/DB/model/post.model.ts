import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IPost} from "../../common/interfaces";
import { AvailabilityEnum } from "../../common/enums";
// import { generateEncryption, generateHash } from "../../common/utils/security";
// import { sendEmail } from "../../common/utils/email";
// import { BadRequestExaption } from "../../common/exception";

const postSchema = new Schema<IPost>({
folderId: { type: String, required: true },
content: {
    type: String,
    required: function (this) {
        return !this.attachments?.length
    }
},
attachments: { type: [String] },

availability: { type: Number, enum: AvailabilityEnum, default: AvailabilityEnum.PUBLIC },
likes: [{ type: Types.ObjectId, ref: "User" }],
tags: [{ type: Types.ObjectId, ref: "User" }],
updatedBy: { type: Types.ObjectId, ref: "User" },
createdBy: { type: Types.ObjectId, ref: "User", required: true },
deletedAt: { type: Date },
restoredAt: { type: Date },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_POSTS"
})
postSchema.virtual('comments',{
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true,
})


postSchema.pre(["findOne","find", "countDocuments"],function(){
    console.log(this);
    console.log(this.getFilter());

    console.log(this.getQuery()); 
    const query = this.getQuery()
    if(query.paranoid === false){
            this.setQuery({...query})

    }else{
    this.setQuery({...query, deletedAt:{$exists:false}})

    }

})


postSchema.pre(["updateOne","findOneAndUpdate"],function(){

    const update = this.getUpdate() as HydratedDocument<IPost
>;
    
    if(update.deletedAt){
        this.setUpdate({...update, $unset:{restoredAt:1}})
    }
        if(update.restoredAt){
        this.setUpdate({...update, $unset:{deletedAt:1}})
        this.setQuery({...this.getQuery(), deletedAt:{$exists:true}})
    }


    console.log(update)

    const query = this.getQuery()
    if(query.paranoid === false){
            this.setQuery({...query})

    }else{
    this.setQuery({ deletedAt:{$exists:false},...query})

    }

})
postSchema.pre(["deleteOne","findOneAndDelete"],function(){


    const query = this.getQuery()
    if(query.force === true){
            this.setQuery({...query})

    }else{
    this.setQuery({ deletedAt:{$exists:true},...query})

    }

})
// postSchema.pre("insertMany", function(docs){
//     console.log(this, docs)
// })
// postSchema.post("insertMany", function(docs, next){
//     console.log(this, docs)
//     next()
// })
// postSchema.pre("deleteOne",{document:true}, function(){
//     console.log(this)
// })
// postSchema.pre("updateOne",{document:true}, function(){
//     console.log(this)
// })
// postSchema.pre("save",async function(this:HydratedDocument<IPost
// >& {wasNew:boolean}){
//     this.wasNew=this.isNew
    // console.log("pre one",this);
    // console.log(this.isNew);
    //         console.log(this.isInit("email"))
    //         console.log(this.isInit("gender"))


    //         console.log(this.isDirectSelected("extra"))

    //     console.log(this.directModifiedPaths())

    // console.log(this.isDirectModified("extra.name"))
    // console.log(this.modifiedPaths(), this.isModified("password"))
//     if(this.isModified("password")){
//     this.password = await generateHash({plaintext:this.password})
//     }
//     if(this.phone && this.isModified("phone")){
//         this.phone = await generateEncryption(this.phone)
//     }
// })
// postSchema.post("save",async function(){
//     console.log("post one",this);
// })

// postSchema.pre("save",function(){
//     console.log("pre two",this);
// })
// postSchema.post("save",async function(doc , next){
//     console.log("post save");
//     next()  
// })
// postSchema.post("save",async function(){
//     const that= this as HydratedDocument<IPost
//>& {wasNew:boolean}
//     console.log({post:that.wasNew});
//     if(that.wasNew){
//             await sendEmail({to:this.email,subject:"ConfirmEmail",html:"hdsjbsjs"})

//     }
// })
//he3ml al validate al awl w at3mlha run 3shan al validate part mn al save run abl ay builtin validators
// postSchema.pre("validate",function(){
//     console.log("pre validate");
//     if(this.password && this.provider == ProviderEnum.GOOGLE){
//         throw new BadRequestExaption ("Google account cannot hold password")
//     }
// })
// postSchema.post("validate",function(){
//     console.log("post validate");
//     if(!this.slug || this.slug.includes(" ")){
//         throw new BadRequestExaption ("invalied slug formate")
//     }
// })
export const PostModel = models.Post || model<IPost>("Post", postSchema);
PostModel.syncIndexes()


// import { model, models, Schema } from "mongoose";
// import { IPost
// } from "../../common/interfaces";
// import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";


// const postSchema = new Schema<IPost>({
//     firstName:{ type: String, required: true },
//     lastName:{ type: String, required: true },    
//     email:{ type: String, required: true, unique: true },
//     password:{ type: String, required: true },
//     bio:{ type: String, maxlength: 200 },
//     phone:{ type: String, required: false },
//     profileImage:{ type: String, required: false },
//     coverImages:{ type: String, required: false },
//     DOB:{ type: Date, required: false },
//     confirmedAt:{ type: Date, required: false },
//     changeCredentialsTime:{type:Date},

//     gender:{ type: Number, enum:GenderEnum, default: GenderEnum.FEMALE},
//     role:{ type: Number, enum:RoleEnum, default: RoleEnum.USER},
//     provider:{type:Number,enum:ProviderEnum,default:ProviderEnum.SYSTEM}
    
// },{
//     timestamps:true,
//     strict:true,
//     collection:"social_App_users",
//     toObject:{virtuals:true},
//     toJSON:{virtuals:true}

// })

// postSchema.virtual("username").get(function(this:IPost){
//     return `${this.firstName} ${this.lastName}`
// }).set(function(this:IPost
//, value:string){
//     const [firstName, lastName] = value.split(" ")
//     this.firstName = firstName as string;
//     this.lastName = lastName as string;
// })
// export const UserModel =models.User || model<IPost
//>("User", postSchema)