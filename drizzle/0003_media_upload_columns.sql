ALTER TABLE `media` ADD `object_key` text;--> statement-breakpoint
ALTER TABLE `media` ADD `content_type` text;--> statement-breakpoint
ALTER TABLE `media` ADD `status` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `created_at` integer;--> statement-breakpoint
UPDATE `media` SET `created_at` = cast(unixepoch('subsecond') * 1000 as integer) WHERE `created_at` IS NULL;
