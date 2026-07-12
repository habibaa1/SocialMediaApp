import { z } from "zod";

export const sayHi = z.strictObject({
  name: z.string().min(2),
});

export const createGroup = {
  body: z.object({
    participantsIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"))
      .min(1),
    group: z.string().min(3),
  }),
};

export const sendGroupMessage = z.strictObject({
  roomId: z.string().min(1),
  content: z.string().min(1),
});

export const joinGroupRoom = z.strictObject({
  roomId: z.string().min(1),
});
