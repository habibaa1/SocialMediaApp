import { IStory } from "../../common/interfaces";
import { StoryModel } from "../model/story.model";
import { BaseRepository } from "./base.reposatory";
export class StoryRepository extends BaseRepository<IStory> {
  constructor() {
    super(StoryModel);
  }
}
