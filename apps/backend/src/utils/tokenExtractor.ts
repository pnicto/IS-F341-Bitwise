import { Request } from 'express'
import { Unauthorized } from '../errors/CustomErrors'

export function accessTokenExtractor(req: Request) {
	if (!('jwt' in req.cookies)) {
		throw new Unauthorized('Access denied')
	}
	return req.cookies.jwt
}
