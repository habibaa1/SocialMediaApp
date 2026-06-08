import { AnyKeys, CreateOptions, FlattenMaps, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryFilter, QueryOptions, Types, UpdateQuery, UpdateWithAggregationPipeline , MongooseUpdateQueryOptions, UpdateResult, DeleteResult, ReturnsNewDoc} from "mongoose";
import { IPaginate, IUser } from "../../common/interfaces";
export abstract class BaseRepository<TRawDocument> {


        constructor(protected readonly model: Model<TRawDocument>) {}

        async create({
            data,
        }: {
            data : AnyKeys<TRawDocument>, 
        }) : Promise<HydratedDocument<TRawDocument>>;


        async create({
            data,
            options
        }: {
            data : AnyKeys<TRawDocument>[], 
            options?: CreateOptions | undefined
        }) : Promise<HydratedDocument<TRawDocument>[]>;


        async create({
            data,
            options
        }: {
            data : AnyKeys<TRawDocument>[], 
            options?: CreateOptions | undefined
        }) : Promise<HydratedDocument<TRawDocument>[] | HydratedDocument<TRawDocument>> 
        {
            return await this.model.create(data as any,options)
        }
        async insertMany({
            data,
        }: {
            data : AnyKeys<TRawDocument>[], 
        }) : Promise<HydratedDocument<TRawDocument>[]>
        {
            return await this.model.insertMany(data as any) as HydratedDocument<TRawDocument>[]
        }
        async createOne({
            data,
            options
        }: {
            data : AnyKeys<TRawDocument>,
            options?: CreateOptions | undefined

        }) : Promise<HydratedDocument<TRawDocument>> {
            const [doc] = await this.create({data:[data], options})
            return doc as HydratedDocument<TRawDocument>
        }
        
        //find

        async findOne({
            filter,
            projection,
            options
        }:{
            filter?: QueryFilter<TRawDocument>,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> &{lean?:false} | null | undefined
        }): Promise<HydratedDocument<TRawDocument>| null> 

            
        async findOne({
            filter,
            projection,
            options
        }:{
            filter?: QueryFilter<TRawDocument>,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> &{lean?:true} | null | undefined
        }): Promise< null|FlattenMaps<IUser>> 
        async findOne({
            filter,
            projection,
            options
        }:{
            filter?: QueryFilter<TRawDocument>,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> | null | undefined
        }): Promise<any> {
            const doc = this.model.findOne(filter,projection)

            if (options?.lean)doc.lean(options.lean);
            if (options?.populate)doc.populate(options.populate as PopulateOptions[]);
            return await doc.exec() 
            }

        async find({
            filter,
            projection,
            options
        }:{
            filter?: QueryFilter<TRawDocument>,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> | null | undefined
        }): Promise<HydratedDocument<TRawDocument>[]> {
            const doc = this.model.find(filter,projection)

            if (options?.lean)doc.lean(options.lean);
            if (options?.skip)doc.skip(options.skip);
            if (options?.limit)doc.limit(options.limit);

            if (options?.populate)doc.populate(options.populate as PopulateOptions[]);
            return await doc.exec() 
            }

async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5
}: {
    filter?: QueryFilter<TRawDocument>,
    projection?: ProjectionType<TRawDocument> | undefined,
    options?: QueryOptions<TRawDocument>,
    page?: number | string | undefined,
    size?: number | string | undefined,
}):Promise<IPaginate<TRawDocument>> {

let count: number = -1
    if (Number(page) > 0) {
        page = parseInt(page as string);
        size = parseInt(size as string);
        options.skip = (page - 1) * size
        options.limit = size;
        count = await this.model.countDocuments({ filter })
    }

    const docs = await this.find({ filter: filter || {}, projection, options })
    return {
        docs,
        ...(Number(page) > 0 ? { currentPage: page, 
            size, 
            pages:Math.ceil(count / parseInt(size as string))
        } : {})
    }
}


//find by id
        async findbyId({
            _id,
            projection,
            options
        }:{
            _id?: Types.ObjectId,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> &{lean?:false} | null | undefined
        }): Promise<HydratedDocument<IUser>| null> 


        async findbyId({
            _id,
            projection,
            options
        }:{
            _id?: Types.ObjectId,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> &{lean?:true} | null | undefined
        }): Promise< null|FlattenMaps<IUser>> 
        async findbyId({
            _id,
            projection,
            options
        }:{
            _id?: Types.ObjectId,
            projection?:ProjectionType<TRawDocument> | undefined,
            options?: QueryOptions<TRawDocument> | null | undefined
        }): Promise<any> {
            const doc = this.model.findById(_id, projection)

            if (options?.lean)doc.lean(options.lean);
            if (options?.populate)doc.populate(options.populate as PopulateOptions[]);
            return await doc.exec() 
            }

    //update
    async findOneAndUpdate ({
        filter,
        update,
        options = {new: true}
    }:{
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument>,
        options?:QueryOptions<TRawDocument> & ReturnsNewDoc
    }) : Promise<HydratedDocument<TRawDocument>| null> {
        if (Array.isArray(update)) {
            update.push({$set:{__v:{$add:["$__v", 1]}}})
    return await this.model.findOneAndUpdate(filter, update, { ...options, updatePipeline: true })
}
        return await this.model.findOneAndUpdate(filter,update, {...options, $inc:{__v:1}} )
    }
    async findbyIdAndUpdate ({
        _id,
        update,
        options = {new: true}
    }:{
        _id: Types.ObjectId,
        update: UpdateQuery<TRawDocument>,
        options:QueryOptions<TRawDocument> & ReturnsNewDoc
    }) : Promise<HydratedDocument<TRawDocument>| null> {
        return await this.model.findByIdAndUpdate(_id, {...update, $inc:{__v:1}}, options )
    }
    async updateOne ({
        filter,
        update,
        options
    }:{
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument>| UpdateWithAggregationPipeline,
        options?:MongooseUpdateQueryOptions| null
    }) : Promise<UpdateResult>{
        return await this.model.updateOne(filter, {...update, $inc:{__v:1}}, options )
    }

    async updateMany ({
        filter,
        update,
        options
    }:{
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument>| UpdateWithAggregationPipeline,
        options?:MongooseUpdateQueryOptions| null
    }) : Promise<UpdateResult>{
        return await this.model.updateMany(filter, update, options )
    }

    //delete
    async findOneAndDelete ({
        filter,
    }:{
        filter: QueryFilter<TRawDocument>,
    }) : Promise<HydratedDocument<TRawDocument>| null> {
        return await this.model.findOneAndDelete(filter )

    }
    async findbyIdAndDelete ({
        _id,
    }:{
        _id: Types.ObjectId,
    }) : Promise<HydratedDocument<TRawDocument>| null> {
        return await this.model.findByIdAndDelete(_id)
    }
        async deleteOne ({
        filter,
    }:{
        filter: QueryFilter<TRawDocument>,
    }) : Promise<DeleteResult>{
        return await this.model.deleteOne(filter )
    }

    async deleteMany ({
        filter,
    }:{
        filter: QueryFilter<TRawDocument>,
    }) : Promise<DeleteResult>{
        return await this.model.deleteMany(filter )
    }
}

