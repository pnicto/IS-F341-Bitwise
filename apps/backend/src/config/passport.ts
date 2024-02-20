import { JwtPayload } from 'jsonwebtoken'
import passport, { DoneCallback } from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { NotFound } from '../errors/CustomErrors'
import { accessTokenExtractor } from '../utils/tokenExtractor'
import { prisma } from './prisma'

const jwtAuthCallback = async (payload: JwtPayload, done: DoneCallback) => {
	try {
		// here we are only selecting the id, email and role instead of exposing all the fields like password to the express `Request` object. We are starting with the least data that we need and we can add more fields as needed.
		const user = await prisma.user.findUnique({
			where: { id: payload.sub },
			select: { id: true, email: true, role: true, username: true },
		})

		if (!user) {
			throw new NotFound('User does not exist')
		}

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
			// FIXME: Add a proper check
			secretOrKey: process.env.TOKEN_SECRET as string,
		},
		jwtAuthCallback,
	),
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

export default passport
