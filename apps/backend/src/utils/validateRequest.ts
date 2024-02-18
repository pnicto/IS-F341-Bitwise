import { Request } from 'express'
import { matchedData, validationResult } from 'express-validator'
import { ValidationError } from '../errors/CustomErrors'

export function validateRequest<T>(req: Request) {
	const errors = validationResult(req)

	if (!errors.isEmpty()) {
		throw new ValidationError(
			errors.array().map((error) => {
				return {
					msg: error.msg as string,
				}
			}),
		)
	}

	return matchedData(req) as T
}
