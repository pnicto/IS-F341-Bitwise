import passport, { DoneCallback } from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { JwtPayload } from 'jsonwebtoken'
import { accessTokenExtractor } from '../utils/tokenExtractor'
import { UserModel } from '@schemas'

const JwtAuthCallback = async (jwt_payload: JwtPayload, done: DoneCallback) => {
	try {
		const user = await UserModel.findOne({ _id: jwt_payload.sub })
		if (!user) {
			return done(null, false)
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
			secretOrKey: process.env.TOKEN_SECRET,
		},
		JwtAuthCallback,
	),
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

export default passport
