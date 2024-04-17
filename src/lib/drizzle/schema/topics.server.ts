import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { messagesTable } from './messages.server'
import { usersTable } from './users.server'

export const topicsTable = sqliteTable(
	'topics',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),

		title: text('title', { length: 64 }),
		responseMode: text('response_mode', { enum: ['faster', 'better'] })
			.notNull()
			.default('faster'),

		userId: integer('user_id')
			.notNull()
			.references(() => usersTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	},
	(table) => ({
		userIdIdx: index('user_id_idx').on(table.userId),
	}),
)

export const topicsRelations = relations(topicsTable, ({ one, many }) => ({
	user: one(usersTable, {
		relationName: 'user',
		fields: [topicsTable.userId],
		references: [usersTable.id],
	}),
	messages: many(messagesTable),
}))

export type InsertTopic = typeof topicsTable.$inferInsert
export type UpdateTopic = Partial<InsertTopic>
export type SelectTopic = typeof topicsTable.$inferSelect

export const insertTopicSchema = createInsertSchema(topicsTable)
export const updateTopicSchema = insertTopicSchema.partial()
