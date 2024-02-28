import { PrismaClient, User } from '@prisma/client'
import { extractUsernameFromEmail } from '../apps/backend/src/features/admin/admin.utils'
import { hashPassword } from '../apps/backend/src/utils/password'

const prisma = new PrismaClient()
const users: Pick<User, 'email' | 'role' | 'balance' | 'shopName'>[] = [
	{ email: 'john@email.com', role: 'ADMIN', balance: 0, shopName: null },
	{ email: 'tron@email.com', role: 'STUDENT', balance: 1000, shopName: null },
	{
		email: 'lane@email.com',
		role: 'VENDOR',
		balance: 1000,
		shopName: 'shoppy',
	},
]
async function main() {
	for (const { email, role, balance, shopName } of users) {
		await prisma.user.upsert({
			where: { email: email },
			update: {},
			create: {
				email,
				role,
				username: extractUsernameFromEmail(email),
				password: await hashPassword('password'),
				balance,
				shopName,
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
