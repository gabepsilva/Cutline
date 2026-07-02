CREATE TABLE `segment` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`segment_order` integer NOT NULL,
	`type` text NOT NULL,
	`media_id` text,
	`duration_seconds` integer NOT NULL,
	`trim_in` real,
	`trim_out` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `segment_projectId_idx` ON `segment` (`project_id`);--> statement-breakpoint
CREATE INDEX `segment_projectId_order_idx` ON `segment` (`project_id`,`segment_order`);--> statement-breakpoint
INSERT INTO `segment` (`id`, `project_id`, `segment_order`, `type`, `media_id`, `duration_seconds`, `trim_in`, `trim_out`, `created_at`)
SELECT
	lower(hex(randomblob(16))),
	`m`.`project_id`,
	0,
	'video',
	`m`.`id`,
	CASE WHEN `m`.`duration_seconds` > 0 THEN `m`.`duration_seconds` ELSE 1 END,
	NULL,
	NULL,
	COALESCE(`m`.`created_at`, cast(unixepoch('subsecond') * 1000 as integer))
FROM `media` AS `m`
WHERE `m`.`object_key` IS NOT NULL
	AND `m`.`id` = (
		SELECT `m2`.`id`
		FROM `media` AS `m2`
		WHERE `m2`.`project_id` = `m`.`project_id`
			AND `m2`.`object_key` IS NOT NULL
		ORDER BY `m2`.`created_at` ASC, `m2`.`id` ASC
		LIMIT 1
	);
