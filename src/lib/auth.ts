import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma"

export const auth = betterAuth({
	session: {
		expiresIn: 60 * 60 * 24,
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	account: {
		accountLinking: {
			enabled: true,
		},
	},
	user: {
		deleteUser: {
			enabled: true,
		},
		additionalFields: {
			identity: {
				type: "string",
			},
			teams: {
				type: "string[]",
			},
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	plugins: [nextCookies()]
})
