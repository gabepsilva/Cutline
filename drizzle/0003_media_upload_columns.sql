ALTER TABLE `media` ADD `object_key` text;--> statement-breakpoint
ALTER TABLE `media` ADD `content_type` text;--> statement-breakpoint
ALTER TABLE `media` ADD `status` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL;
