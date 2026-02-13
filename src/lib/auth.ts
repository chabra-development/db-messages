import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma"
import { Role } from "@prisma/client";

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
			role: {
				type: ["USER", "SUPERVISOR", "ADMIN"],
				defaultValue: Role.USER,
				input: false
			},
			isActive: {
				type: "boolean",
				required: false,
				defaultValue: true,
			},
			banner: {
				type: "string",
				required: false,
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			minPasswordLength: 8,
			maxPasswordLength: 128,
			autoSignIn: true,
		},
		trustedOrigins: [
			process.env.VERCEL_URL || "http://localhost:3000",
		],
		advanced: {
			generateId: () => crypto.randomUUID(),
			useSecureCookies: process.env.NODE_ENV === "production",
			cookieSameSite: "lax",
		},
		plugins: [nextCookies()]
	}
})
