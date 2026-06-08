import { ApplicationExaption } from "./application.exception"

export class BadRequestExaption extends ApplicationExaption {

    constructor(message:string="BadRequest " , cause?: unknown){
        super(message ,400, cause)

    }
}

export class ConflictExeption extends ApplicationExaption {

    constructor(message:string='conflict' , cause?: unknown){
        super(message ,409, cause)

    }
}


export class NotFoundExeption extends ApplicationExaption {

    constructor(message:string='NotFound' , cause?: unknown){
        super(message ,404, cause)

    }
}


export class UnauthorizedExeption extends ApplicationExaption {

    constructor(message:string='Unauthorize' , cause?: unknown){
        super(message ,401, cause)

    }
}

export class ForbiddenExeption extends ApplicationExaption {

    constructor(message:string='Forbidden' , cause?: unknown){
        super(message ,403, cause)

    }
}