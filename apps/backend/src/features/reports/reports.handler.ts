import dayjs, { ManipulateType } from 'dayjs'
import { RequestHandler } from 'express'
import { query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'
import {
	calculateVendorDataForInterval,
	getStartAndEndDates,
	getTimeIntervals,
} from './reports.utils'

export const validateVendorReport = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]
export const getVendorReport: RequestHandler = async (req, res, next) => {
	try {
		const vendor = getAuthorizedUser(req)
		const { preset, fromDate, toDate } = validateRequest<{
			preset?: string
			fromDate?: string
			toDate?: string
		}>(req)

		if (!vendor.shopName) {
			throw new Forbidden('Only vendors can view their reports')
		}

		let startDate: Date,
			endDate: Date,
			compareStartDate: Date,
			compareEndDate: Date,
			intervals: Date[][]

		const fromDateObj = dayjs(fromDate)
		const toDateObj = dayjs(toDate)

		if (fromDate && toDate && !(fromDateObj.isValid() && toDateObj.isValid())) {
			throw new BadRequest('Invalid date format')
		}

		if (preset && fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, preset as ManipulateType)
		} else if (preset) {
			// https://github.com/prettier/prettier/issues/1935#issuecomment-306729468
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate, intervals } =
				getStartAndEndDates(preset))
		} else if (fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day')
			const diffInHours = toDateObj.diff(fromDateObj, 'hour')
			let intervalUnit: ManipulateType

			if (diffInDays >= 28) {
				intervalUnit = 'month'
			} else if (diffInDays > 6) {
				intervalUnit = 'week'
			} else if (diffInDays >= 1 && diffInHours > 1) {
				intervalUnit = 'day'
			} else {
				intervalUnit = 'hour'
			}

			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, intervalUnit)
		} else {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate, intervals } =
				getStartAndEndDates('month'))
		}

		const currentTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: vendor.shopName,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
		})

		const compareTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: vendor.shopName,
				createdAt: {
					gte: compareStartDate,
					lte: compareEndDate,
				},
			},
		})

		const currentUniqueVisitors = new Set()
		let currentTotalIncome = 0
		currentTransactions.forEach((transaction) => {
			currentUniqueVisitors.add(transaction.senderUsername)
			currentTotalIncome += transaction.amount
		})
		const currentUniqueVisitorsCount = currentUniqueVisitors.size

		const compareUniqueVisitors = new Set()
		let compareTotalIncome = 0
		compareTransactions.forEach((transaction) => {
			compareUniqueVisitors.add(transaction.senderUsername)
			compareTotalIncome += transaction.amount
		})
		const compareUniqueVisitorsCount = compareUniqueVisitors.size

		const intervalData = intervals.map((interval) =>
			calculateVendorDataForInterval(currentTransactions, interval),
		)

		return res.status(StatusCodes.OK).json({
			uniqueVisitorsCount: {
				currentUniqueVisitorsCount,
				compareUniqueVisitorsCount,
			},
			totalIncome: {
				currentTotalIncome,
				compareTotalIncome,
			},
			intervalData,
		})
	} catch (err) {
		next(err)
	}
}

export const getTimelineReport: RequestHandler = async (req, res, next) => {
	try {
		const user = getAuthorizedUser(req)
		const transactionsMadeThisMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().startOf('month').toDate(),
					lte: dayjs().endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})
		const sent = transactionsMadeThisMonth.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const received = transactionsMadeThisMonth.filter(
			(transaction) => transaction.receiverUsername === user.username,
		)

		const sentAmount = sent.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)
		const receivedAmount = received.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)

		const sentTimeline = sent.map((transaction) => ({
			label: dayjs(transaction.createdAt).format('DD/MM'),
			amount: transaction.amount,
		}))
		const receivedTimeline = received.map((transaction) => ({
			label: dayjs(transaction.createdAt).format('DD/MM'),
			amount: transaction.amount,
		}))

		const combinedTransactions: Record<
			string,
			{ sentAmount: number; receivedAmount: number }
		> = {}

		sentTimeline.forEach((transaction) => {
			if (combinedTransactions[transaction.label]) {
				combinedTransactions[transaction.label].sentAmount += transaction.amount
			} else {
				combinedTransactions[transaction.label] = {
					sentAmount: transaction.amount,
					receivedAmount: 0,
				}
			}
		})
		receivedTimeline.forEach((transaction) => {
			if (combinedTransactions[transaction.label]) {
				combinedTransactions[transaction.label].receivedAmount +=
					transaction.amount
			} else {
				combinedTransactions[transaction.label] = {
					receivedAmount: transaction.amount,
					sentAmount: 0,
				}
			}
		})

		const combinedTimeline: {
			label: string
			sentAmount: number
			receivedAmount: number
		}[] = []

		for (const label in combinedTransactions) {
			combinedTimeline.push({
				label,
				receivedAmount: combinedTransactions[label].receivedAmount,
				sentAmount: combinedTransactions[label].sentAmount,
			})
		}

		const transactionsMadePreviousMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().subtract(1, 'month').startOf('month').toDate(),
					lte: dayjs().subtract(1, 'month').endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})
		const sentPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const receivedPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.receiverUsername === user.username,
		)

		const sentAmountPrevious = sentPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)
		const receivedAmountPrevious = receivedPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)

		return res.json({
			timeline: combinedTimeline,
			current: {
				sent: sentAmount,
				received: receivedAmount,
			},
			previous: {
				sent: sentAmountPrevious,
				received: receivedAmountPrevious,
			},
		})
	} catch (err) {
		next(err)
	}
}
