import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { topicsTable } from './topics.server'

export const usersTable = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),

	name: text('name', { length: 64 }).notNull(),
	email: text('email', { length: 320 }).notNull().unique(),
	image: text('image', { length: 1024 }),

	plan: text('plan', {
		enum: [
			'free',
			'paid',
			'grace', // while downgrading from 'paid' to 'free'
			'sponsored', // same as 'paid', but got it for free
		],
	})
		.notNull()
		.default('free'),
	encryptedOwnOpenaiApiKey: text('encrypted_own_openai_api_key', { length: 256 }),

	prefersSideBarOpen: integer('prefers_side_bar_open', { mode: 'boolean' }).default(false),
})

export const usersRelations = relations(usersTable, ({ many }) => ({
	topics: many(topicsTable),
}))

export type InsertUser = typeof usersTable.$inferInsert
export type UpdateUser = Partial<InsertUser>
export type SelectUser = typeof usersTable.$inferSelect

export const insertUserSchema = createInsertSchema(usersTable, {
	email: (schema) => schema.email.email(),
})
export const updateUserSchema = insertUserSchema.partial()
