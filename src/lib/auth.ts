import { Role } from "@prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { randomUUID } from "node:crypto"
import { prisma } from "./prisma"

export const auth = betterAuth({
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	account: {
		accountLinking: {
			enabled: true,
		},
	},	
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
	},
	user: {
		deleteUser: {
			enabled: true,
		},
		additionalFields: {
			identity: {
				type: "string",
				required: false,      
				defaultValue: "",         
				input: true,       
			},
			teams: {
				type: "string[]",
				defaultValue: [],         
			},
			role: {
				type: ["USER", "SUPERVISOR", "ADMIN"],
				defaultValue: Role.USER,
				input: false,      
			},
			isActive: {
				type: "boolean",
				required: false,
				defaultValue: true,
				input: false,
			},
			banner: {
				type: "string",
				required: false,
				input: false,
			}
		},
	},
	trustedOrigins: [
		process.env.VERCEL_URL || "http://localhost:3000",
	],
	advanced: {
		database: {
			generateId: () => randomUUID(),
		},
		useSecureCookies: process.env.NODE_ENV === "production",
		cookieSameSite: "lax",
	},
	plugins: [nextCookies()]
})