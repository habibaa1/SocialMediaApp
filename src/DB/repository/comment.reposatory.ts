import { IComment} from "../../common/interfaces";
import { BaseRepository } from "./base.reposatory";
import { CommentModel } from "../model";

export class CommentRepository extends  BaseRepository<IComment> {
        constructor() {
            super(CommentModel)
        }
        
}