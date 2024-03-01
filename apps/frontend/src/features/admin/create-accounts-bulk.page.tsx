import { Icon } from '@iconify/react'
import { Button, FileInput, Table } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import CsvParser from 'papaparse'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

type NewAccount = Pick<User, 'email' | 'role' | 'shopName'>

const CreateAccountsBulk = () => {
	const [csvFile, setCsvFile] = useState<File | null>(null)
	const [previewCsvData, setPreviewCsvData] = useState<NewAccount[]>([])

	const resetInput = () => {
		setCsvFile(null)
		setPreviewCsvData([])
	}

	// callback function is needed here the data cannot be returned from the function from what I know
	const parseCsv = (
		file: File | null,
		preview: boolean,
		callback: (data: NewAccount[]) => void,
	) => {
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => {
			if (e.target) {
				const csvData = e.target.result as string
				const results = CsvParser.parse<NewAccount>(csvData, {
					header: true,
					skipEmptyLines: 'greedy',
					// if preview is true, only parse 10 rows else parse all the data
					preview: preview ? 10 : 0,
				})

				callback(results.data)
			}
		}
		reader.readAsText(file)
	}

	const createAccountInBulk = useMutation({
		mutationFn: (body: NewAccount[]) => {
			return axios.post<{ message: string; errors: { msg: string }[] }>(
				'/admin/create/bulk',
				body,
			)
		},
		onSuccess: ({ data }) => {
			resetInput()
			notifications.show({ message: data.message, color: 'green' })

			// TODO: Discuss if these errors should be shown as list instead of notifications or more importantly should these be errors or warnings, where we just tell them x number of accounts were skipped
			for (const error of data.errors) {
				notifications.show({ message: error.msg, color: 'red' })
			}
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	return (
		<>
			<h1 className='text-3xl font-bold mb-5 text-center'>
				Bulk User Creation
			</h1>
			<form
				className='flex flex-col gap-5 items-center mb-5'
				onSubmit={(e) => {
					e.preventDefault()
					parseCsv(csvFile, false, createAccountInBulk.mutate)
				}}
			>
				<FileInput
					label='Accounts CSV'
					description='Upload a CSV file with email and role columns to create accounts in bulk'
					placeholder='Tap/Click to upload a CSV file'
					value={csvFile}
					onChange={setCsvFile}
					accept='.csv'
					rightSection={<Icon icon='lucide:x' onClick={() => resetInput()} />}
				/>
				<Button
					disabled={!csvFile}
					onClick={() =>
						parseCsv(csvFile, true, (data) => setPreviewCsvData(data))
					}
				>
					Parse CSV
				</Button>

				{previewCsvData.length > 0 && (
					<>
						<h2 className='text-2xl text-center font-bold'>Preview</h2>

						<Table className='text-center'>
							<Table.Thead>
								<Table.Tr>
									<Table.Th className='!text-center'>Email</Table.Th>
									<Table.Th className='!text-center'>Role</Table.Th>
									<Table.Th className='!text-center'>Shop Name</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{previewCsvData.map(({ email, role, shopName }, i) => {
									return (
										<Table.Tr key={i}>
											<Table.Td>{email}</Table.Td>
											<Table.Td>{role}</Table.Td>
											<Table.Td>{shopName}</Table.Td>
										</Table.Tr>
									)
								})}
							</Table.Tbody>
						</Table>
					</>
				)}

				<Button
					type='submit'
					disabled={!csvFile || createAccountInBulk.isPending}
				>
					Create Accounts
				</Button>
			</form>
		</>
	)
}

export default CreateAccountsBulk
