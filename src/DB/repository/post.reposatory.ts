import { IPost} from "../../common/interfaces";
import { BaseRepository } from "./base.reposatory";
import {PostModel} from "../model/post.model";

export class PostRepository extends  BaseRepository<IPost> {
        constructor() {
            super(PostModel)
        }
        
}