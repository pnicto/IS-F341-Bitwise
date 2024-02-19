import { JwtPayload } from 'jsonwebtoken'
import passport, { DoneCallback } from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { accessTokenExtractor } from '../utils/tokenExtractor'
import { prisma } from './prisma'

const JwtAuthCallback = async (jwt_payload: JwtPayload, done: DoneCallback) => {
	try {
		const user = await prisma.user.findUniqueOrThrow({
			where: { id: jwt_payload.sub },
			select: { id: true, email: true, role: true },
		})

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
		JwtAuthCallback,
	),
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

export default passport
