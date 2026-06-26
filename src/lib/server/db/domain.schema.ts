import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const project = sqliteTable(
	'project',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		kind: text('kind').notNull(),
		description: text('description'),
		durationSeconds: integer('duration_seconds').notNull(),
		thumb: text('thumb').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('project_userId_idx').on(table.userId)]
);

export const transcript = sqliteTable('transcript', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	projectId: text('project_id')
		.notNull()
		.unique()
		.references(() => project.id, { onDelete: 'cascade' }),
	words: text('words').notNull(),
	captionStyle: text('caption_style').notNull().default('karaoke')
});

export const media = sqliteTable(
	'media',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		durationSeconds: integer('duration_seconds').notNull(),
		kind: text('kind').notNull(),
		thumb: text('thumb').notNull(),
		sizeBytes: integer('size_bytes').notNull().default(0)
	},
	(table) => [index('media_projectId_idx').on(table.projectId)]
);

export const overlay = sqliteTable(
	'overlay',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		mediaId: text('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'restrict' }),
		name: text('name').notNull(),
		startSeconds: real('start_seconds').notNull(),
		durationSeconds: real('duration_seconds').notNull(),
		thumb: text('thumb').notNull()
	},
	(table) => [
		index('overlay_projectId_idx').on(table.projectId),
		index('overlay_mediaId_idx').on(table.mediaId)
	]
);

export const projectRelations = relations(project, ({ one, many }) => ({
	user: one(user, {
		fields: [project.userId],
		references: [user.id]
	}),
	transcript: one(transcript, {
		fields: [project.id],
		references: [transcript.projectId]
	}),
	media: many(media),
	overlays: many(overlay)
}));

export const transcriptRelations = relations(transcript, ({ one }) => ({
	project: one(project, {
		fields: [transcript.projectId],
		references: [project.id]
	})
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
	project: one(project, {
		fields: [media.projectId],
		references: [project.id]
	}),
	overlays: many(overlay)
}));

export const overlayRelations = relations(overlay, ({ one }) => ({
	project: one(project, {
		fields: [overlay.projectId],
		references: [project.id]
	}),
	media: one(media, {
		fields: [overlay.mediaId],
		references: [media.id]
	})
}));
