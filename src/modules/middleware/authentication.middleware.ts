import { NextFunction , Request,Response} from "express"
import { UnauthorizedExeption } from "../../common/exception";
import { TokenService } from "../../common/services";
import { TokenTypeEnum } from "../../common/enums";




export const authentication = (tokenType:TokenTypeEnum=TokenTypeEnum.ACCESS)=>{
    return async (req:Request, res:Response, next:NextFunction) =>{
        const tokenService = new TokenService()
        const [key, credential] = req.headers?.authorization?.split(" ") || [];
        console.log({ key, credential });

        if (!key || !credential) {
            throw new UnauthorizedExeption( 'Missing authorization' );
        }

        switch (key) {
            case 'Basic':

                break;

            default:
                const {decoded, user} = await tokenService.decodeToken({ token: credential, tokenType });
                req.user = user;
                req.decoded = decoded;               
                break;
        }

        next()
    }
}
