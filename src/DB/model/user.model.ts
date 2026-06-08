import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IUser } from "../../common/interfaces";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";
import { generateEncryption, generateHash } from "../../common/utils/security";
// import { sendEmail } from "../../common/utils/email";
// import { BadRequestExaption } from "../../common/exception";

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug:{type:String, required:true},
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function (this: any) {
            return this.provider == ProviderEnum.SYSTEM;
        }
    },
    phone: { type: String },
    profileImage: { type: String },
    coverImages: { type: [String] },
    friends: [{type : Types.ObjectId, ref:"User"}],

    gender: { type: Number, enum: GenderEnum, default: GenderEnum.MALE },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.USER },
    provider: { type: Number, enum: ProviderEnum, default: ProviderEnum.SYSTEM },

    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date },

    extra:{
        name:String
    }

}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_USERS"
});


userSchema.virtual("username").set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName as string;
    this.lastName = lastName as string;
    this.slug = value.replaceAll(/\s+/g,"-")
}).get(function () {
    return `${this.firstName} ${this.lastName}`;
});


userSchema.pre(["findOne","find"],function(){
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


    userSchema.pre(["updateOne","findOneAndUpdate"],function(){

    const update = this.getUpdate() as HydratedDocument<IUser>;
    
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
userSchema.pre(["deleteOne","findOneAndDelete"],function(){


    const query = this.getQuery()
    if(query.force === true){
            this.setQuery({...query})

    }else{
    this.setQuery({ deletedAt:{$exists:true},...query})

    }

})
// userSchema.pre("insertMany", function(docs){
//     console.log(this, docs)
// })
// userSchema.post("insertMany", function(docs, next){
//     console.log(this, docs)
//     next()
// })
// userSchema.pre("deleteOne",{document:true}, function(){
//     console.log(this)
// })
// userSchema.pre("updateOne",{document:true}, function(){
//     console.log(this)
// })
userSchema.pre("save",async function(this:HydratedDocument<IUser>& {wasNew:boolean}){
    this.wasNew=this.isNew
    // console.log("pre one",this);
    // console.log(this.isNew);
    //         console.log(this.isInit("email"))
    //         console.log(this.isInit("gender"))


    //         console.log(this.isDirectSelected("extra"))

    //     console.log(this.directModifiedPaths())

    // console.log(this.isDirectModified("extra.name"))
    // console.log(this.modifiedPaths(), this.isModified("password"))
    if(this.isModified("password")){
    this.password = await generateHash({plaintext:this.password})
    }
    if(this.phone && this.isModified("phone")){
        this.phone = await generateEncryption(this.phone)
    }
})
// userSchema.post("save",async function(){
//     console.log("post one",this);
// })

// userSchema.pre("save",function(){
//     console.log("pre two",this);
// })
// userSchema.post("save",async function(doc , next){
//     console.log("post save");
//     next()  
// })
// userSchema.post("save",async function(){
//     const that= this as HydratedDocument<IUser>& {wasNew:boolean}
//     console.log({post:that.wasNew});
//     if(that.wasNew){
//             await sendEmail({to:this.email,subject:"ConfirmEmail",html:"hdsjbsjs"})

//     }
// })
//he3ml al validate al awl w at3mlha run 3shan al validate part mn al save run abl ay builtin validators
// userSchema.pre("validate",function(){
//     console.log("pre validate");
//     if(this.password && this.provider == ProviderEnum.GOOGLE){
//         throw new BadRequestExaption ("Google account cannot hold password")
//     }
// })
// userSchema.post("validate",function(){
//     console.log("post validate");
//     if(!this.slug || this.slug.includes(" ")){
//         throw new BadRequestExaption ("invalied slug formate")
//     }
// })
export const UserModel = models.User || model<IUser>("User", userSchema);
UserModel.syncIndexes()

// import { model, models, Schema } from "mongoose";
// import { IUser } from "../../common/interfaces";
// import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";


// const userSchema = new Schema<IUser>({
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

// userSchema.virtual("username").get(function(this:IUser){
//     return `${this.firstName} ${this.lastName}`
// }).set(function(this:IUser, value:string){
//     const [firstName, lastName] = value.split(" ")
//     this.firstName = firstName as string;
//     this.lastName = lastName as string;
// })
// export const UserModel =models.User || model<IUser>("User", userSchema)