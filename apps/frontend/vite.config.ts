/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import path from 'path'
import { defineConfig } from 'vite'

const { resolve } = createRequire(import.meta.url)

const prismaClient = `prisma${path.sep}client`
const prismaClientIndexBrowser = resolve(
	'@prisma/client/index-browser',
).replace(`@${prismaClient}`, `.${prismaClient}`)

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/apps/frontend',

	resolve: {
		alias: {
			'.prisma/client/index-browser': path.relative(
				__dirname,
				prismaClientIndexBrowser,
			),
		},
	},
	server: {
		port: 4200,
		host: 'localhost',
	},

	preview: {
		port: 4300,
		host: 'localhost',
	},

	plugins: [react(), nxViteTsPaths()],

	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [ nxViteTsPaths() ],
	// },

	build: {
		outDir: '../../dist/apps/frontend',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},

	test: {
		globals: true,
		cache: {
			dir: '../../node_modules/.vitest',
		},
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

		reporters: ['default'],
		coverage: {
			reportsDirectory: '../../coverage/apps/frontend',
			provider: 'v8',
		},
	},
})
