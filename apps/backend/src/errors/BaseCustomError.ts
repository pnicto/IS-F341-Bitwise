import { StatusCodes } from 'http-status-codes'

export class CustomError extends Error {
	statusCode: StatusCodes

	constructor(msg: string, statusCode: StatusCodes) {
		super(msg)
		this.statusCode = statusCode
		Object.setPrototypeOf(this, CustomError.prototype)
	}

	serializeErrors() {
		return [{ msg: this.message }]
	}
}
