"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const security_1 = require("../../common/utils/security");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return this.provider === enums_1.ProviderEnum.SYSTEM;
        },
    },
    phone: { type: String },
    profileImage: { type: String },
    coverImages: { type: [String] },
    gender: {
        type: String,
        enum: Object.values(enums_1.GenderEnum),
        default: enums_1.GenderEnum.MALE,
    },
    role: {
        type: String,
        enum: Object.values(enums_1.RoleEnum),
        default: enums_1.RoleEnum.USER,
    },
    provider: {
        type: String,
        enum: Object.values(enums_1.ProviderEnum),
        default: enums_1.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_USERS",
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
    this.slug = value.replaceAll(/\s+/g, "-");
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
async function cascadeSoftDeleteUserRelated(user) {
    const now = new Date();
    await user.model("Post").updateMany({ createdBy: user._id, deletedAt: null }, { $set: { deletedAt: now } });
    await user.model("Comment").updateMany({ createdBy: user._id, deletedAt: null }, { $set: { deletedAt: now } });
    await user.model("Notification").updateMany({ $or: [{ recipientId: user._id }, { senderId: user._id }], deletedAt: null }, { $set: { deletedAt: now } });
}
userSchema.pre("save", async function () {
    if (this.isModified("password") && this.password) {
        this.password = await (0, security_1.generateHash)({ plaintext: this.password });
    }
    if (this.phone && this.isModified("phone")) {
        this.phone = await (0, security_1.generateEncryption)(this.phone);
    }
    if (this.isModified("firstName") || this.isModified("lastName")) {
        const fullName = `${this.firstName} ${this.lastName}`;
        this.slug = fullName.replaceAll(/\s+/g, "-").toLowerCase();
    }
    if (this.isModified("deletedAt") && this.deletedAt) {
        await cascadeSoftDeleteUserRelated(this);
    }
});
userSchema.pre("updateOne", { document: true, query: false }, async function () {
    const update = this.updateOne();
    const set = update?.$set ?? {};
    if (set.password) {
        set.password = await (0, security_1.generateHash)({ plaintext: set.password });
    }
    if (set.phone) {
        set.phone = await (0, security_1.generateEncryption)(set.phone);
    }
    const firstName = set.firstName ?? this.firstName;
    const lastName = set.lastName ?? this.lastName;
    if (set.firstName || set.lastName) {
        set.slug = `${firstName} ${lastName}`
            .replaceAll(/\s+/g, "-")
            .toLowerCase();
    }
});
userSchema.pre("deleteOne", { document: true, query: false }, async function () {
    const conflict = await this.model("User").findOne({
        slug: this.slug,
        _id: { $ne: this._id },
        deletedAt: null,
    });
    if (conflict) {
        throw new Error(`Name conflict: another user with slug "${this.slug}" already exists.`);
    }
    this.deletedAt = new Date();
    await this.save();
});
userSchema.pre(["find", "findOne", "findOneAndUpdate", "findOneAndDelete"], function () {
    if (this.getOptions().withDeleted)
        return;
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
    }
});
userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], { document: false, query: true }, async function () {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
    }
    const update = this.getUpdate();
    const set = update?.$set ?? {};
    if (set.password) {
        set.password = await (0, security_1.generateHash)({ plaintext: set.password });
        update.$set = set;
    }
    if (set.phone) {
        set.phone = await (0, security_1.generateEncryption)(set.phone);
        update.$set = set;
    }
    if (set.firstName || set.lastName) {
        const currentDoc = await this.model.findOne(filter).lean();
        const firstName = set.firstName ?? currentDoc?.firstName ?? "";
        const lastName = set.lastName ?? currentDoc?.lastName ?? "";
        set.slug = `${firstName} ${lastName}`
            .replaceAll(/\s+/g, "-")
            .toLowerCase();
        update.$set = set;
    }
});
const DELETE_OPS = ["deleteOne", "deleteMany"];
DELETE_OPS.forEach((op) => {
    userSchema.pre(op, { document: false, query: true }, async function () {
        const filter = this.getFilter();
        const softFilter = { ...filter, deletedAt: null };
        if (op === "deleteOne") {
            await this.model.updateOne(softFilter, {
                $set: { deletedAt: new Date() },
            });
        }
        else {
            await this.model.updateMany(softFilter, {
                $set: { deletedAt: new Date() },
            });
        }
        this.setQuery({ _id: null });
    });
});
exports.UserModel = mongoose_1.models.user || (0, mongoose_1.model)("User", userSchema);
