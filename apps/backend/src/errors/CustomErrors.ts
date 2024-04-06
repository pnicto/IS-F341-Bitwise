import { StatusCodes } from 'http-status-codes'
import { CustomError } from './BaseCustomError'

export class NotFound extends CustomError {
	constructor(msg: string) {
		super(msg, StatusCodes.NOT_FOUND)
		Object.setPrototypeOf(this, NotFound.prototype)
	}
}

export class BadRequest extends CustomError {
	constructor(msg: string) {
		super(msg, StatusCodes.BAD_REQUEST)
		Object.setPrototypeOf(this, BadRequest.prototype)
	}
}

export class Unauthorized extends CustomError {
	constructor(msg: string) {
		super(msg, StatusCodes.UNAUTHORIZED)
		Object.setPrototypeOf(this, Unauthorized.prototype)
	}
}

export class Forbidden extends CustomError {
	constructor(msg: string) {
		super(msg, StatusCodes.FORBIDDEN)
		Object.setPrototypeOf(this, Forbidden.prototype)
	}
}

export class InternalServerError extends CustomError {
	constructor(msg: string) {
		super(msg, StatusCodes.INTERNAL_SERVER_ERROR)
		Object.setPrototypeOf(this, InternalServerError.prototype)
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
