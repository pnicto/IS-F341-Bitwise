import { fakerEN_IN as faker } from '@faker-js/faker'
import { PrismaClient, Product, Transaction, User } from '@prisma/client'
import { extractUsernameFromEmail } from '../apps/backend/src/features/admin/admin.utils'
import { hashPassword } from '../apps/backend/src/utils/password'

faker.seed(23)
const prisma = new PrismaClient()

const SHOP_NAMES = [
	'The Shop',
	'Quick Mart',
	'Elite Goods',
	'Swift Sales',
	'Smart Mart',
	'Swift Shop',
	'Value Store',
	'Main Street Mart',
	'Prime Goods',
	'Rapid Retail',
] as const

const CATEGORY_NAMES = [
	'Food',
	'Books',
	'Electronics',
	'Clothing',
	'Household',
	'Health',
	'Office',
	'Cosmetics',
	'Misc',
]

const categories = CATEGORY_NAMES.map((categoryName) => {
	return { name: categoryName }
})

async function main() {
	await prisma.transaction.deleteMany({})
	console.log('Transactions deleted')
	await prisma.product.deleteMany({})
	console.log('Products deleted')
	await prisma.user.deleteMany({})
	console.log('Users deleted')
	await prisma.category.deleteMany({})
	console.log('Categories deleted')

	const users: Omit<User, 'id' | 'enabled'>[] = [
		{
			email: 'john@email.com',
			role: 'ADMIN',
			username: extractUsernameFromEmail('john@email.com'),
			password: await hashPassword('password'),
			balance: 0,
			shopName: null,
			mobile: null,
		},
		{
			email: 'tron@email.com',
			role: 'STUDENT',
			username: extractUsernameFromEmail('tron@email.com'),
			password: await hashPassword('password'),
			balance: 1000,
			shopName: null,
			mobile: null,
		},
		{
			email: 'lane@email.com',
			role: 'VENDOR',
			username: extractUsernameFromEmail('lane@email.com'),
			password: await hashPassword('password'),
			balance: 1000,
			shopName: 'shoppy',
			mobile: null,
		},
	]

	for (let i = 0; i < 10; i++) {
		const email = faker.internet.email()
		users.push({
			email: email,
			role: 'STUDENT',
			username: extractUsernameFromEmail(email),
			password: await hashPassword('password'),
			balance: faker.number.int({ min: 100, max: 10000 }),
			shopName: null,
			mobile: null,
		})
	}

	for (let i = 0; i < 50; i++) {
		const email = faker.internet.email()
		users.push({
			email: email,
			role: 'STUDENT',
			username: extractUsernameFromEmail(email),
			password: await hashPassword('password'),
			balance: faker.number.int({ min: 100, max: 10000 }),
			shopName: null,
			mobile: faker.phone.number().replace(/-/g, '').slice(3),
		})
	}

	for (let i = 0; i < 10; i++) {
		const email = faker.internet.email()
		users.push({
			email: email,
			role: 'VENDOR',
			username: extractUsernameFromEmail(email),
			password: await hashPassword('password'),
			balance: faker.number.int({ min: 1000, max: 10000 }),
			shopName: SHOP_NAMES[i],
			mobile: faker.phone.number().replace(/-/g, '').slice(3),
		})
	}

	await prisma.user.createMany({ data: users })
	console.log('Seeded users')

	await prisma.category.createMany({ data: categories })

	const products: Omit<Product, 'id'>[] = []

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
				categoryName: faker.helpers.arrayElement(CATEGORY_NAMES),
				updatedAt: productDate,
				sellerDetails: {
					email: v.email,
					mobile: v.mobile,
					shopName: v.shopName,
					username: v.username,
				},
			})
		}
	}

	await prisma.product.createMany({ data: products })
	console.log('Seeded products')

	const transactions: Omit<Transaction, 'id'>[] = []
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
		})
	}

	await prisma.transaction.createMany({ data: transactions })
	console.log('Seeded transactions')
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		// console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
