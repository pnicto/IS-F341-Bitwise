import ImageKit from 'imagekit'

export const imagekit = new ImageKit({
	urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT as string,
	publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY as string,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
})
