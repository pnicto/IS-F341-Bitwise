import { fakerEN_IN as faker } from '@faker-js/faker'
import { PrismaClient, Product, Transaction, User } from '@prisma/client'
import {
	extractUsernameFromEmail,
	hashPassword,
} from '../apps/backend/src/features/admin/admin.utils'

faker.seed(23)
const prisma = new PrismaClient()

async function main() {
	await prisma.transaction.deleteMany({})
	await prisma.product.deleteMany({})
	await prisma.user.deleteMany({})

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

	const products: Pick<
		Product,
		'name' | 'description' | 'price' | 'vendorId' | 'createdAt' | 'updatedAt'
	>[] = []

	const vendors = await prisma.user.findMany({ where: { role: 'VENDOR' } })
	for (const v of vendors) {
		for (let i = 0; i < 10; i++) {
			const productDate = faker.date.between({
				from: '2024-01-01T00:00:00.000Z',
				to: '2024-02-29T00:00:00.000Z',
			})
			products.push({
				name: faker.commerce.productName(),
				description: faker.commerce.productDescription(),
				price: parseInt(faker.commerce.price({ min: 10, max: 1000, dec: 0 })),
				vendorId: v['id'],
				createdAt: productDate,
				updatedAt: productDate,
			})
		}
	}

	for (const {
		name,
		description,
		price,
		vendorId,
		createdAt,
		updatedAt,
	} of products) {
		await prisma.product.upsert({
			where: {
				name_vendorId: {
					name: name,
					vendorId: vendorId,
				},
			},
			update: {},
			create: {
				name,
				description,
				price,
				vendorId,
				createdAt,
				updatedAt,
			},
		})
	}

	const transactions: Pick<
		Transaction,
		'senderUsername' | 'receiverUsername' | 'amount' | 'createdAt' | 'status'
	>[] = []
	const students = await prisma.user.findMany({ where: { role: 'STUDENT' } })
	for (let i = 0; i < 50; i++) {
		const v = faker.helpers.arrayElement(vendors)
		const v_products = await prisma.product.findMany({
			where: { vendorId: v['id'] },
		})
		const product = faker.helpers.arrayElement(v_products)
		transactions.push({
			senderUsername: faker.helpers.arrayElement(students)['username'],
			receiverUsername: v['username'],
			amount: product['price'],
			createdAt: faker.date.between({
				from: product['updatedAt'],
				to: '2024-02-29T00:00:00.000Z',
			}),
			status: faker.datatype.boolean({ probability: 0.8 }),
		})
	}

	await prisma.transaction.createMany({ data: transactions })
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
