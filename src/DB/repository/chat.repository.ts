import {
  FlattenMaps,
  HydratedDocument,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
} from "mongoose";
import { IChat } from "../../common/interfaces";
import { chatModel } from "../model/chat.model";
import { BaseRepository } from "./base.reposatory";

export class chatRepository extends BaseRepository<IChat> {
  constructor() {
    super(chatModel);
  }

  // Method overloads
  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: false }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<HydratedDocument<IChat> | null>;

  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: true }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<FlattenMaps<IChat> | null>;

  // Implementation
  async findOneChat({
    filter,
    projection,
    options,
    page = "1",
    size = "5",
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: boolean }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<HydratedDocument<IChat> | FlattenMaps<IChat> | null> {
    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(size as string, 10);

    // Calculate slice indices for messages pagination
    // Using negative slicing to get messages from the end
    const skip = (pageNum - 1) * sizeNum;
    const sliceStart = -(skip + sizeNum);
    // Build the projection with paginated messages slice
    const projectionObj: any = {
      ...((projection as any) || {}),
      messages: { $slice: [sliceStart, sizeNum] },
    };

    // Build the query
    let query = this.model.findOne(filter, projectionObj);

    // Apply population if specified
    if (options?.populate) {
      query = query.populate(options.populate as PopulateOptions[]);
    }

    // Apply lean based on the options
    if (options?.lean !== undefined) {
      query = query.lean(options.lean);
    }

    return await query.exec();
  }
}
