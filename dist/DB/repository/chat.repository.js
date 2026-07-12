"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = void 0;
const chat_model_1 = require("../model/chat.model");
const base_reposatory_1 = require("./base.reposatory");
class chatRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(chat_model_1.chatModel);
    }
    async findOneChat({ filter, projection, options, page = "1", size = "5", }) {
        const pageNum = parseInt(page, 10);
        const sizeNum = parseInt(size, 10);
        const skip = (pageNum - 1) * sizeNum;
        const sliceStart = -(skip + sizeNum);
        const projectionObj = {
            ...(projection || {}),
            messages: { $slice: [sliceStart, sizeNum] },
        };
        let query = this.model.findOne(filter, projectionObj);
        if (options?.populate) {
            query = query.populate(options.populate);
        }
        if (options?.lean !== undefined) {
            query = query.lean(options.lean);
        }
        return await query.exec();
    }
}
exports.chatRepository = chatRepository;
