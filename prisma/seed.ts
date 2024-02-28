import { fakerEN_IN as faker } from '@faker-js/faker'
import { PrismaClient, User } from '@prisma/client'
import {
	extractUsernameFromEmail,
	hashPassword,
} from '../apps/backend/src/features/admin/admin.utils'

const prisma = new PrismaClient()
const users: Pick<
	User,
	'email' | 'mobile' | 'role' | 'balance' | 'shopName'
>[] = [
	{
		email: 'john@email.com',
		role: 'ADMIN',
		balance: 0,
		shopName: null,
		mobile: null,
	},
	{
		email: 'tron@email.com',
		role: 'STUDENT',
		balance: 1000,
		shopName: null,
		mobile: null,
	},
	{
		email: 'lane@email.com',
		role: 'VENDOR',
		balance: 1000,
		shopName: 'shoppy',
		mobile: null,
	},
]

for (let i = 0; i < 10; i++) {
	users.push({
		email: faker.internet.email(),
		role: 'STUDENT',
		balance: faker.number.int({ min: 100, max: 10000 }),
		shopName: null,
		mobile: null,
	})
}

for (let i = 0; i < 50; i++) {
	users.push({
		email: faker.internet.email(),
		role: 'STUDENT',
		balance: faker.number.int({ min: 100, max: 10000 }),
		shopName: null,
		mobile: faker.phone.number().replace(/-/g, '').slice(3),
	})
}

for (let i = 0; i < 10; i++) {
	users.push({
		email: faker.internet.email(),
		role: 'VENDOR',
		balance: faker.number.int({ min: 1000, max: 10000 }),
		shopName: null,
		mobile: faker.phone.number().replace(/-/g, '').slice(3),
	})
}

async function main() {
	for (const { email, role, balance, shopName, mobile } of users) {
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
				mobile,
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
