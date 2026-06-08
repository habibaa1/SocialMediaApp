import { createClient, RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config";
import { EmailEnum } from "../enums";
import { Types } from "mongoose";
// import this.client from "@redis/client/dist/lib/client";
type RedisKeyType ={email:string,subject?: EmailEnum}
export class RedisService {
    private readonly client: RedisClientType;
    constructor() {
        this.client = createClient({
            url: REDIS_URI
        })
        this.handleEvents();
    }
    private handleEvents () {
        this.client.on("error", (err) => console.error("Redis Client Error", err));
        this.client.on("ready", () => console.log("Redis Client is ready"));
    }
    public async connect() {
        await this.client.connect();
        console.log("Connected to Redis😘");
    }

// SessionKey = ({ sId }: { sId: string }): string => {
// return SessionKey::${sId};
// };

// RefreshKey = ({ sId }: { sId: string }): string => {
// return RefreshKey::${sId};

// };

// logoutAllKey = ({ sub }: { sub: string }): string => {
// return logoutAllKey::${sub};
// };

otpKey = ({ email, subject= EmailEnum.Confirm_Email }: RedisKeyType): string => {
    return `OTP::User::${email}::${subject}`
}
maxAttemptOtpKey = ({ email, subject = EmailEnum.Confirm_Email }: RedisKeyType): string => {
    return `${this.otpKey({ email, subject })}::MaxTrial`
}
blockOtpKey = ({ email, subject= EmailEnum.Confirm_Email }: RedisKeyType): string => {
    return `${this.otpKey({ email, subject })}::block`
}
baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
    return `RevokeToken::${userId.toString()}`
}
revokeTokenKey = ({ userId, jti }: { userId: Types.ObjectId | string; jti: string }): string => {
    return `${this.baseRevokeTokenKey(userId)}::${jti}`
}

// otpRequestCount = ({
// type,
// sub,
// }: {
// type: string;
// sub: string;
// }): string => {
// return OTP::otpRequestCount::${type}:${sub};
// };

set = async ({
key,
value,
ttl,
// NX = false,
}: {
key: string;
value: any;
ttl?: number | undefined;
// NX?: boolean;
}): Promise<string|null> => {
    try {
        let data =typeof value === "string" ? value : JSON.stringify(value);
    return ttl ? await this.client.set(key, data, {EX: ttl}) : await this.client.set(key, data) ;

    // const options: any = {};
    // if (ttl) options.EX = ttl;
    // if (NX) options.NX = true;

    } catch (error) {
    console.log(`fail in redis set operation ${error}`);
    return null;
    }
};



update = async ({
    key,
    value,
    ttl,
}: {
    key: string;
    value: string|object;
    ttl?: number|undefined;
}): Promise<string|number|null> => {
    try {
    if (!await this.client.exists(key)) return 0;
    return await this.set({key,value,ttl})

    } catch (error) {
        console.log(`fail in redis update operation ${error}`);  
        return 0;
    }
};

get = async (key:string): Promise<any> =>{

    try {
        try {
            return JSON.parse(await this.client.get(key)as string);
        } catch (error) {
                return await this.client.get(key);

    }
    } catch (error) {
        console.log(`fail in redis get operation ${error}`);  
    return ;
    }
};




ttl = async (key: string): Promise <number> => {

    try {
    return await this.client.ttl(key);
    } catch (error) {
        console.log(`fail in redis ttl operation ${error}`);  
        return -2;
    }
}

exist = async (key:string):Promise<number> =>{

    try {
    return await this.client.exists(key);
    } catch (error) {
        console.log(`fail in redis exist operation ${error}`);  
        return -2;
    }

}
// allKeysByPrefix = async (
//     baseKey: string
// ): Promise<string[]> => {
// return await this.client.keys(baseKey);
// };



incr = async (key:string):Promise<number> =>{

    try {
    return await this.client.exists(key);
    } catch (error) {
        console.log(`fail in redis incr operation ${error}`);  
        return -2;
    }

}
expire = async ({
    key,
    ttl,
}: {
    key: string;
    ttl: number;
}): Promise<number> => {
    try {
    return await this.client.expire(key, ttl);;
    } catch (error) {
        console.log(`fail in redis add-expire operation ${error}`);  
        return 0;
    }
};
mGet = async (keys: string[]) :Promise<string[]|number|null> => {
    try {
        if (keys.length) return 0 ;
        return await this.client.mGet(keys) as string[];
    } catch (error) {
    console.error("Redis MGET error:", error);
    return [];
    }
}
Keys = async (prefix:string):Promise<string[]> =>{

    try {
        return await this.client.keys(`${prefix}`);
    } catch (error) {
        console.log(`fail in redis keys operation ${error}`);  
        return [];
    }

}
deleteKey = async (key:string|string[]): Promise<number> => {
    try {
        if (!key.length) return 0;
        return await this.client.del(key);
    } catch (error) {
        console.log(`fail in redis keys operation ${error}`);  
    return 0;
    } 
};

FCM_key(userId: Types.ObjectId | string) {
    return `user:FCM:${userId}`;
}
async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sAdd(this.FCM_key(userId), FCMToken);
}

async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sRem(this.FCM_key(userId), FCMToken);
}

async getFCMs(userId: Types.ObjectId | string) {
    return await this.client.sMembers(this.FCM_key(userId));
}

async hasFCMs(userId: Types.ObjectId | string) {
    return await this.client.sCard(this.FCM_key(userId));
}

async removeFCMUser(userId: Types.ObjectId | string) {
    return await this.client.del(this.FCM_key(userId));
}

}   

export const redisService = new RedisService(); 