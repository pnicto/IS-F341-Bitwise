import { StatusCodes } from 'http-status-codes'
import { CustomError } from './BaseCustomError'

export class NotFound extends CustomError {
	constructor(message: string) {
		super(message, StatusCodes.NOT_FOUND)
		Object.setPrototypeOf(this, NotFound.prototype)
	}
}

export class BadRequest extends CustomError {
	constructor(message: string) {
		super(message, StatusCodes.BAD_REQUEST)
		Object.setPrototypeOf(this, BadRequest.prototype)
	}
}

export class Unauthorized extends CustomError {
	constructor(message: string) {
		super(message, StatusCodes.UNAUTHORIZED)
		Object.setPrototypeOf(this, Unauthorized.prototype)
	}
}

export class Forbidden extends CustomError {
	constructor(message: string) {
		super(message, StatusCodes.FORBIDDEN)
		Object.setPrototypeOf(this, Forbidden.prototype)
	}
}

export class ValidationError extends BadRequest {
	errors: { msg: string }[]
	constructor(errors: { msg: string }[]) {
		super('Validation Failed')
		this.errors = errors

		Object.setPrototypeOf(this, ValidationError.prototype)
	}
}
