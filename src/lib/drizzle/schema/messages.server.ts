import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { topicsTable } from './topics.server'

export const messagesTable = sqliteTable(
	'messages',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),

		role: text('role', { enum: ['system', 'assistant', 'user'] }).notNull(),
		content: text('content', { length: 15000 }).notNull(),

		topicId: integer('topic_id')
			.notNull()
			.references(() => topicsTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	},
	(table) => ({
		topicIdIdx: index('topic_id_idx').on(table.topicId),
		roleTopicIdIdx: index('role_topic_id_idx').on(table.role, table.topicId),
	}),
)

export const messagesRelations = relations(messagesTable, ({ one }) => ({
	topic: one(topicsTable, {
		relationName: 'topic',
		fields: [messagesTable.topicId],
		references: [topicsTable.id],
	}),
}))

export type InsertMessage = typeof messagesTable.$inferInsert
export type SelectMessage = typeof messagesTable.$inferSelect

export const insertMessageSchema = createInsertSchema(messagesTable)
