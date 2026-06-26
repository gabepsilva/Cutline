CREATE TABLE `job` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`payload` text NOT NULL,
	`result` text,
	`error` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`cancel_requested` integer DEFAULT false NOT NULL,
	`locked_by` text,
	`lease_until` integer,
	`run_after` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_claim_idx` ON `job` (`status`,`run_after`,`priority`);--> statement-breakpoint
CREATE INDEX `job_projectId_idx` ON `job` (`project_id`);
