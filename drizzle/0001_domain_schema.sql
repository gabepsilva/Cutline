CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`duration_seconds` integer NOT NULL,
	`thumb` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_userId_idx` ON `project` (`user_id`);--> statement-breakpoint
CREATE TABLE `transcript` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`words` text NOT NULL,
	`caption_style` text DEFAULT 'karaoke' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transcript_project_id_unique` ON `transcript` (`project_id`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`kind` text NOT NULL,
	`thumb` text NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_projectId_idx` ON `media` (`project_id`);--> statement-breakpoint
CREATE TABLE `overlay` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`media_id` text NOT NULL,
	`name` text NOT NULL,
	`start_seconds` real NOT NULL,
	`duration_seconds` real NOT NULL,
	`thumb` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `overlay_projectId_idx` ON `overlay` (`project_id`);--> statement-breakpoint
CREATE INDEX `overlay_mediaId_idx` ON `overlay` (`media_id`);--> statement-breakpoint
DROP TABLE `task`;
