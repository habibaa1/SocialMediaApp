    import { model, models, Schema } from "mongoose";
    import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";
    import { IUser } from "../../common/interfaces";
    import { HydratedDocument } from "mongoose";
    import { generateEncryption, generateHash } from "../../common/utils/security";

    export type UserDocument = HydratedDocument<IUser>;

    const userSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },

        slug: { type: String, required: true },

        email: { type: String, required: true, unique: true },
        password: {
        type: String,
        required: function (this: IUser) {
            return this.provider === ProviderEnum.SYSTEM;
        },
        },

        phone: { type: String },
        profileImage: { type: String },
        coverImages: { type: [String] },

        gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.MALE,
        },
        role: {
        type: String,
        enum: Object.values(RoleEnum),
        default: RoleEnum.USER,
        },
        provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.SYSTEM,
        },

        changeCredentialsTime: { type: Date },
        DOB: { type: Date },
        confirmEmail: { type: Date },

        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        strict: true,
        strictQuery: true,
        collection: "SOCIAL_USERS",
    },
    );

    userSchema
    .virtual("username")
    .set(function (this: IUser, value: string) {
        const [firstName, lastName] = value.split(" ") || [];
        this.firstName = firstName as string;
        this.lastName = lastName as string;
        this.slug = value.replaceAll(/\s+/g, "-");
    })
    .get(function (this: IUser) {
        return `${this.firstName} ${this.lastName}`;
    });

    async function cascadeSoftDeleteUserRelated(user: UserDocument) {
    const now = new Date();
    await user.model("Post").updateMany(
        { createdBy: user._id, deletedAt: null },
        { $set: { deletedAt: now } },
    );
    await user.model("Comment").updateMany(
        { createdBy: user._id, deletedAt: null },
        { $set: { deletedAt: now } },
    );
    await user.model("Notification").updateMany(
        { $or: [{ recipientId: user._id }, { senderId: user._id }], deletedAt: null },
        { $set: { deletedAt: now } },
    );
    }

    ///////////////// HOOKS ////////////////////

    //  save
    userSchema.pre("save", async function (this: UserDocument) {
    // Hash password
    if (this.isModified("password") && this.password) {
        this.password = await generateHash({ plaintext: this.password });
    }

    if (this.phone && this.isModified("phone")) {
        this.phone = await generateEncryption(this.phone);
    }

    if (this.isModified("firstName") || this.isModified("lastName")) {
        const fullName = `${this.firstName} ${this.lastName}`;
        this.slug = fullName.replaceAll(/\s+/g, "-").toLowerCase();
    }

    if (this.isModified("deletedAt") && this.deletedAt) {
        await cascadeSoftDeleteUserRelated(this);
    }
    });

    //  updateOne
    userSchema.pre(
    "updateOne",
    { document: true, query: false },
    async function (this: UserDocument) {
        const update = this.updateOne() as Record<string, any>;
        const set = update?.$set ?? {};

        if (set.password) {
        set.password = await generateHash({ plaintext: set.password });
        }

        if (set.phone) {
        set.phone = await generateEncryption(set.phone);
        }

        const firstName = set.firstName ?? this.firstName;
        const lastName = set.lastName ?? this.lastName;
        if (set.firstName || set.lastName) {
        set.slug = `${firstName} ${lastName}`
            .replaceAll(/\s+/g, "-")
            .toLowerCase();
        }
    },
    );

    //  deleteOne
    userSchema.pre(
    "deleteOne",
    { document: true, query: false },
    async function (this: UserDocument) {
        // Name-conflict guard example — you can adapt the condition to your needs
        const conflict = await this.model("User").findOne({
        slug: this.slug,
        _id: { $ne: this._id },
        deletedAt: null,
        });

        if (conflict) {
        throw new Error(
            `Name conflict: another user with slug "${this.slug}" already exists.`,
        );
        }

        this.deletedAt = new Date();
        await this.save();
    },
    );

    userSchema.pre(
    ["find", "findOne", "findOneAndUpdate", "findOneAndDelete"],
    function (this: any) {
        if (this.getOptions().withDeleted) return;

        const filter = this.getFilter();
        if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
        }
    },
    );

    userSchema.pre(
    ["updateOne", "updateMany", "findOneAndUpdate"],
    { document: false, query: true },
    async function (this: any) {
        const filter = this.getFilter();
        if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
        }

        const update = this.getUpdate() as Record<string, any>;
        const set = update?.$set ?? {};

        if (set.password) {
        set.password = await generateHash({ plaintext: set.password });
        update.$set = set;
        }

        if (set.phone) {
        set.phone = await generateEncryption(set.phone);
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
    },
    );

    const DELETE_OPS = ["deleteOne", "deleteMany"] as const;

    DELETE_OPS.forEach((op) => {
    userSchema.pre(
        op,
        { document: false, query: true },
        async function (this: any) {
        const filter = this.getFilter();

        // Only operate on non-deleted documents
        const softFilter = { ...filter, deletedAt: null };

        if (op === "deleteOne") {
            await this.model.updateOne(softFilter, {
            $set: { deletedAt: new Date() },
            });
        } else {
            await this.model.updateMany(softFilter, {
            $set: { deletedAt: new Date() },
            });
        }
        this.setQuery({ _id: null });
        },
    );
    });

    export const UserModel = models.user || model<IUser>("User", userSchema);
