export interface ILoginRessponse{access_token:string,refresh_token:string}

export interface ISignupResspones extends ILoginRessponse{
    username:string
    _id:string
}