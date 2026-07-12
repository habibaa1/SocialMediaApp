"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGroupRoom = exports.sendGroupMessage = exports.createGroup = exports.sayHi = void 0;
const zod_1 = require("zod");
exports.sayHi = zod_1.z.strictObject({
    name: zod_1.z.string().min(2),
});
exports.createGroup = {
    body: zod_1.z.object({
        participantsIds: zod_1.z
            .array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"))
            .min(1),
        group: zod_1.z.string().min(3),
    }),
};
exports.sendGroupMessage = zod_1.z.strictObject({
    roomId: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
});
exports.joinGroupRoom = zod_1.z.strictObject({
    roomId: zod_1.z.string().min(1),
});
