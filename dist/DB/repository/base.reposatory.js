"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    async insertMany({ data, }) {
        return await this.model.insertMany(data);
    }
    async createOne({ data, options }) {
        const [doc] = await this.create({ data: [data], options });
        return doc;
    }
    async findOne({ filter, projection, options }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        if (options?.populate)
            doc.populate(options.populate);
        return await doc.exec();
    }
    async find({ filter, projection, options }) {
        const doc = this.model.find(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        if (options?.skip)
            doc.skip(options.skip);
        if (options?.limit)
            doc.limit(options.limit);
        if (options?.populate)
            doc.populate(options.populate);
        return await doc.exec();
    }
    async paginate({ filter, projection, options = {}, page = 0, size = 5 }) {
        let count = -1;
        if (Number(page) > 0) {
            page = parseInt(page);
            size = parseInt(size);
            options.skip = (page - 1) * size;
            options.limit = size;
            count = await this.model.countDocuments({ filter });
        }
        const docs = await this.find({ filter: filter || {}, projection, options });
        return {
            docs,
            ...(Number(page) > 0 ? { currentPage: page,
                size,
                pages: Math.ceil(count / parseInt(size))
            } : {})
        };
    }
    async findbyId({ _id, projection, options }) {
        const doc = this.model.findById(_id, projection);
        if (options?.lean)
            doc.lean(options.lean);
        if (options?.populate)
            doc.populate(options.populate);
        return await doc.exec();
    }
    async findOneAndUpdate({ filter, update, options = { new: true } }) {
        if (Array.isArray(update)) {
            update.push({ $set: { __v: { $add: ["$__v", 1] } } });
            return await this.model.findOneAndUpdate(filter, update, { ...options, updatePipeline: true });
        }
        return await this.model.findOneAndUpdate(filter, update, { ...options, $inc: { __v: 1 } });
    }
    async findbyIdAndUpdate({ _id, update, options = { new: true } }) {
        return await this.model.findByIdAndUpdate(_id, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateMany({ filter, update, options }) {
        return await this.model.updateMany(filter, update, options);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
    async findbyIdAndDelete({ _id, }) {
        return await this.model.findByIdAndDelete(_id);
    }
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
}
exports.BaseRepository = BaseRepository;
