import type { Express,Request,Response,NextFunction} from "express";
import express from "express";
import { authRouter, userRouter , PostRouter, schema} from "./modules";
import { globalErroHandler } from "./modules/middleware";
import { connectDB } from "./DB/connections.db";
import { PORT } from "./config/config";
import { redisService, s3Service } from "./common/services";
import cors from "cors"
// import { UserModel } from "./DB/model";
import { UserRepository } from "./DB/repository/user.reposatory";
// import { GenderEnum } from "./common/enums";
import { Types } from "mongoose";
import { successResponse } from "./common/response";
import {pipeline} from "node:stream"
import { promisify } from "node:util";
import { createHandler } from "graphql-http/lib/use/express";
// import { DESTRUCTION } from "node:dns";
// import { GenderEnum } from "./common/enums";
// import { ProviderEnum } from "./common/enums";
export const bootstrap = async () => {
    const s3WriteStream = promisify(pipeline)
    const app:Express = express();
app.use(express.json()); 
app.use(cors()); 

// app.post("/send-notfication" , async (req:Request,res:Response,next:NextFunction) : Promise<express.Response> =>{
//         console.log({token:req.body.token});

//         await notificationService.sendNotification({
//             token: req.body.token,
//             data: {
//                 title: "hello from node",
//                 body: "this is a test notification"
//             }
//         });
//         return res.status(200).json({message:"landing page"});
//     })
    //     app.get("/" , (req:express.Request,res:express.Response,next:express.NextFunction"=>
    //     res.status(200).json({message:"landing page"});
    // })  mmkn ashel al type mn hna al hea kalmt express 3shan hdkhlha fo2
    app.get("/" , (req:Request,res:Response,next:NextFunction) : express.Response =>{
        return res.status(200).json({message:"landing page"});
    })

    //application routes
    app.use("/auth", authRouter);
    app.use("/user",userRouter);
    app.use("/post",PostRouter);
    app.all('/graphql', createHandler({ schema: schema }));


app.get("/uploads/*path", async (req: express.Request, res: express.Response, next: express.NextFunction)=> {
    const {download ,fileName} = req.query as {download: string, fileName: string}
    const { path } = req.params as { path: string[] };
    const Key = path.join("/");
    
    const { Body, ContentType } = await s3Service.getAsset({ Key });
    console.log({ Body, ContentType });
    res.setHeader("Content-Type", ContentType || "application/octet-stream");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (download === "true") {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`);
    }
    return await s3WriteStream(Body as NodeJS.ReadableStream, res);
});
app.get("/pre-signed/*path", async (req: express.Request, res: express.Response, next: express.NextFunction)=> {
    const {download ,fileName} = req.query as {download: string, fileName: string}
    const { path } = req.params as { path: string[] };

    const Key = path.join("/");
    const url = await s3Service.CreatePreSignedFetchLink({ Key , download, fileName });
    return successResponse({ res, data:{ url } });
});
    //application error
    app.use(globalErroHandler)
    app.get("/*dummy" , (req:Request,res:Response,next:NextFunction)=>{
        res.status(404).json({message:"invalid route"});
    })

    await connectDB();
    await redisService.connect();


try {
    const userRepository = new UserRepository()
    // const user = await userRepository.find({
    //     filter:{
    //     // _id: Types.ObjectId.createFromHexString('69f74525a162b9e7a94407a3')
    //     // gender:GenderEnum.FEMALE,
    //     paranoid:false,
    //     // deletedAt:{$exists:true}
    //     }
    // })
    // console.log(user);

        const user = await userRepository.deleteOne({
        filter:{
        _id: Types.ObjectId.createFromHexString('69fe27744b49da3e63c0c967'),
        force:true
        // gender:GenderEnum.FEMALE,
        // paranoid:false,
        // deletedAt:{$exists:true}
        },
        })
            // console.log(user);

    
    
    // const user = await new UserModel ({
    // username:"habiba mohamed",
    // password:"52525",
    // email:`${Date.now()}@gmail.com`,
    // phone:"01156254198",
    // extra:{
    //     name:"retal"
    // }
    // "extra.name":"haboba"
    // provider:ProviderEnum.GOOGLE
// }).save({validateBeforeSave:true})
    // const user = await UserModel.findOne({ slug: { $exists: true } } as any);    
        // await user.deleteOne({gender:0})

    // user.gender= GenderEnum.FEMALE;
    // await user.save()


} catch (error) {
    console.log(error);
}
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}👌`);
    });
    // console.log("application is bootstrapped");
}
export default bootstrap
