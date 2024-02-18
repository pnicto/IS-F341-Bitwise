import { StatusCodes } from 'http-status-codes'

export class CustomError extends Error {
	statusCode: StatusCodes

	constructor(message: string, statusCode: StatusCodes) {
		super(message)
		this.statusCode = statusCode
		Object.setPrototypeOf(this, CustomError.prototype)
	}

	serializeErrors() {
		return [{ msg: this.message }]
	}
}
