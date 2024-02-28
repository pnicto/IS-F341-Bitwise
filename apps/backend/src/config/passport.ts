import { JwtPayload } from 'jsonwebtoken'
import passport, { DoneCallback } from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { Forbidden, NotFound } from '../errors/CustomErrors'
import { accessTokenExtractor } from '../utils/tokenExtractor'
import { prisma } from './prisma'

const jwtAuthCallback = async (payload: JwtPayload, done: DoneCallback) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: payload.sub },
		})

		if (!user) {
			throw new NotFound('User does not exist')
		}
		if (!user.enabled) {
			throw new Forbidden('User account is disabled')
		}

		// Remove password from user object when exposing in req.user
		user.password = ''
		return done(null, user)
	} catch (err) {
		return done(err, false)
	}
}

passport.use(
	'jwt',
	new JwtStrategy(
		{
			jwtFromRequest: accessTokenExtractor,
			secretOrKey: process.env.TOKEN_SECRET as string,
		},
		jwtAuthCallback,
	),
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

export default passport
