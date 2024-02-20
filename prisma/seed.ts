import { PrismaClient, User } from '@prisma/client'
import {
	extractUsernameFromEmail,
	hashPassword,
} from '../apps/backend/src/features/admin/admin.utils'

const prisma = new PrismaClient()
const users: Pick<User, 'email' | 'role' | 'balance'>[] = [
	{ email: 'john@email.com', role: 'ADMIN', balance: 0 },
	{ email: 'tron@email.com', role: 'STUDENT', balance: 1000 },
	{ email: 'lane@email.com', role: 'VENDOR', balance: 1000 },
]
async function main() {
	for (const { email, role } of users) {
		await prisma.user.upsert({
			where: { email: email },
			update: {},
			create: {
				email,
				role,
				username: extractUsernameFromEmail(email),
				password: await hashPassword('password'),
			},
		})
	}
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
