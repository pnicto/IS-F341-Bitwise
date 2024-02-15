import { WalletModel, Transaction, TransactionModel } from '@schemas'
import { RequestHandler } from 'express'
import mongoose, { ClientSession } from 'mongoose'

export const makePayment: RequestHandler = async (req, res) => {
	const { from, to, amount }: Transaction = req.body
	if (!from || !to || !amount) {
		return res.status(400).send({ message: 'Invalid body' })
	}
	const session: ClientSession = await mongoose.startSession()
	session.startTransaction()

	try {
		const fromWallet = await WalletModel.findOne({ user: from })
		if (!fromWallet) {
			return res.status(400).send({ message: `Invalid from user: ${from}` })
		}
		const toWallet = await WalletModel.findOne({ user: to })
		if (!toWallet) {
			return res.status(400).send({ message: `Invalid to user: ${to}` })
		}
		if (fromWallet.balance < amount) {
			return res
				.status(400)
				.send({ message: 'Insufficient funds, please top up your wallet' })
		}
		fromWallet.balance -= amount
		toWallet.balance += amount
		await fromWallet.save()
		await toWallet.save()
        const time = Date.now()
		const transaction = new TransactionModel({ from, to, amount, time})
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
