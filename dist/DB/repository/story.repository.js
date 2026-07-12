"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryRepository = void 0;
const story_model_1 = require("../model/story.model");
const base_reposatory_1 = require("./base.reposatory");
class StoryRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(story_model_1.StoryModel);
    }
}
exports.StoryRepository = StoryRepository;
