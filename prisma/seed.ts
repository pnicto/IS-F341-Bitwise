import { fakerEN_IN as faker } from '@faker-js/faker'
import { PrismaClient, Product, Transaction, User } from '@prisma/client'
import { extractUsernameFromEmail } from '../apps/backend/src/features/admin/admin.utils'
import { hashPassword } from '../apps/backend/src/utils/password'
import imageData from './images'

faker.seed(2323)
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

// const images: any[] = []
let imageIndex = 0

async function main() {
	await prisma.transaction.deleteMany({})
	console.log('Transactions deleted')
	await prisma.product.deleteMany({})
	console.log('Products deleted')
	await prisma.paymentRequest.deleteMany({})
	console.log('Payment Requests deleted')
	await prisma.user.deleteMany({})
	console.log('Users deleted')
	await prisma.category.deleteMany({})
	console.log('Categories deleted')

	const users: Omit<User, 'id' | 'enabled' | 'tags' | 'shopBalance'>[] = [
		{
			email: 'john@email.com',
			role: 'ADMIN',
			username: extractUsernameFromEmail('john@email.com'),
			password: await hashPassword('password'),
			balance: 0,
			shopName: null,
			mobile: faker.phone.number().replace(/-/g, '').slice(3),
		},
		{
			email: 'tron@email.com',
			role: 'STUDENT',
			username: extractUsernameFromEmail('tron@email.com'),
			password: await hashPassword('password'),
			balance: 1000,
			shopName: null,
			mobile: faker.phone.number().replace(/-/g, '').slice(3),
		},
		{
			email: 'lane@email.com',
			role: 'VENDOR',
			username: extractUsernameFromEmail('lane@email.com'),
			password: await hashPassword('password'),
			balance: 1000,
			shopName: 'shoppy',
			mobile: faker.phone.number().replace(/-/g, '').slice(3),
		},
	]

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
	console.log('Seeded categories')

	const products: Omit<Product, 'id'>[] = []

	const vendors = await prisma.user.findMany({ where: { role: 'VENDOR' } })
	for (const v of vendors) {
		for (let i = 0; i < 25; i++) {
			const productDate = faker.date.between({
				from: '2024-01-01T00:00:00.000Z',
				to: '2024-02-29T00:00:00.000Z',
			})
			const name = faker.commerce.productName()

			// let uploadResponse
			// try {
			// 	uploadResponse = await imagekit.upload({
			// 		file: faker.image.urlPicsumPhotos(),
			// 		fileName: name,
			// 		useUniqueFileName: true,
			// 		folder: '/bitwise',
			// 	})
			// 	images.push({
			// 		fileId: uploadResponse.fileId,
			// 		imagePath: uploadResponse.filePath,
			// 	})
			// } catch (err) {
			// 	console.log(err)
			// 	exit(1)
			// }

			products.push({
				name: name,
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
				imageId: imageData[imageIndex].fileId,
				imagePath: imageData[imageIndex].imagePath,
			})
			imageIndex++
		}
	}

	await prisma.product.createMany({ data: products })
	console.log('Seeded products')

	const transactions: Omit<
		Transaction,
		'id' | 'senderTags' | 'receiverTags'
	>[] = []
	const nonAdminUsers = await prisma.user.findMany({
		where: { OR: [{ role: 'STUDENT' }, { role: 'VENDOR' }] },
	})
	// Shop transactions
	for (let i = 0; i < 50; i++) {
		const v = faker.helpers.arrayElement(vendors)
		const v_products = await prisma.product.findMany({
			where: { vendorId: v['id'] },
		})
		const product = faker.helpers.arrayElement(v_products)

		transactions.push({
			senderUsername: faker.helpers.arrayElement(nonAdminUsers)['username'],
			receiverUsername: v['shopName'] as string,
			amount: product['price'],
			createdAt: faker.date.between({
				from: product['updatedAt'],
				to: '2024-02-29T00:00:00.000Z',
			}),
		})
	}

	// P2P transactions
	for (let i = 0; i < 50; i++) {
		const participants = faker.helpers.arrayElements(nonAdminUsers, 2)

		transactions.push({
			senderUsername: participants[0].username,
			receiverUsername: participants[1].username,
			amount: parseInt(faker.commerce.price({ min: 1, max: 5000, dec: 0 })),
			createdAt: faker.date.between({
				from: '2024-01-01T00:00:00.000Z',
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

		// const jsonData = JSON.stringify(images, null, 2)
		// fs.writeFile('images.json', jsonData, (err) => {
		// 	if (err) {
		// 		console.error('Error writing JSON file:', err)
		// 	} else {
		// 		console.log('Images logged to images.json')
		// 	}
		// })
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
