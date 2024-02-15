import { UserModel, TransactionModel } from '@schemas'
import { RequestHandler } from 'express'
import mongoose, { ClientSession } from 'mongoose'

export const makePayment: RequestHandler = async (req, res) => {
	const { from, to, amount } = req.body
	if (!from || !to || !amount) {
		return res.status(400).send({ message: 'Invalid body' })
	}
	const session: ClientSession = await mongoose.startSession()
	session.startTransaction()

	try {
		const fromUser = await UserModel.findOne({ idNumber: from })
		if (!fromUser) {
			return res.status(400).send({ message: `Invalid from user: ${from}` })
		}
		const toUser = await UserModel.findOne({ idNumber: to })
		if (!toUser) {
			return res.status(400).send({ message: `Invalid to user: ${to}` })
		}
		if (fromUser.wallet.balance < amount) {
			return res
				.status(400)
				.send({ message: 'Insufficient funds, please top up your wallet' })
		}
		fromUser.wallet.balance -= amount
		toUser.wallet.balance += amount
		await fromUser.save()
		await toUser.save()
        const time = Date.now()
		const transaction = new TransactionModel({ amount, from: fromUser._id, to: toUser._id, time })
		await transaction.save()
		await session.commitTransaction()
		return res.status(201).json({ transaction })
	} catch (err) {
		console.log(err)
		await session.abortTransaction()
		return res.status(500).send({ message: 'Internal server error' })
	} finally {
		session.endSession()
	}
}
