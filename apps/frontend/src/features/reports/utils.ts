export const getCategoryColor = (value: number) => {
	const palette = [
		'red',
		'violet',
		'yellow',
		'blue',
		'grape',
		'indigo',
		'cyan',
		'green',
		'pink',
		'orange',
		'lime',
		'teal',
		'#0074D9',
		'gray',
		'#FF4136',
		'#2ECC40',
		'#FF851B',
		'#7FDBFF',
		'#B10DC9',
		'#FFDC00',
		'#001F3F',
		'#39CCCC',
		'#01FF70',
		'#85144B',
		'#F012BE',
		'#3D9970',
	]

	return palette[value % (palette.length - 1)]
}
