CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `key_ring` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`active_dek_id` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`plaintext_schema_version` integer DEFAULT 1 NOT NULL,
	`encryption_algorithm` text NOT NULL,
	`encryption_params` text NOT NULL,
	`ciphertext` blob NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "key_ring_ciphertext_size_check" CHECK(length("key_ring"."ciphertext") <= 65536)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `key_ring_user_id_idx` ON `key_ring` (`user_id`);--> statement-breakpoint
CREATE TABLE `key_ring_wrapping` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`method` text NOT NULL,
	`status` text NOT NULL,
	`kdf_algorithm` text NOT NULL,
	`kdf_params` text NOT NULL,
	`kdf_salt` blob NOT NULL,
	`wrapping_algorithm` text NOT NULL,
	`wrapping_params` text NOT NULL,
	`ciphertext` blob NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "key_ring_wrapping_kdf_salt_size_check" CHECK(length("key_ring_wrapping"."kdf_salt") = 16),
	CONSTRAINT "key_ring_wrapping_ciphertext_size_check" CHECK(length("key_ring_wrapping"."ciphertext") = 48)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `key_ring_wrapping_active_user_method_unique` ON `key_ring_wrapping` (`user_id`,`method`) WHERE "key_ring_wrapping"."status" = 'active';--> statement-breakpoint
CREATE INDEX `key_ring_wrapping_user_id_idx` ON `key_ring_wrapping` (`user_id`);--> statement-breakpoint
CREATE TABLE `sync_record` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`seq` integer NOT NULL,
	`encryption_algorithm` text NOT NULL,
	`encryption_params` text NOT NULL,
	`key_ring_revision` integer NOT NULL,
	`ciphertext` blob NOT NULL,
	`kind` text NOT NULL,
	`encryption_key_id` text NOT NULL,
	`created` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "sync_record_ciphertext_size_check" CHECK(length("sync_record"."ciphertext") <= 1048592)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_record_user_id_seq_idx` ON `sync_record` (`user_id`,`seq`);--> statement-breakpoint
CREATE TABLE `tx_assert` (
	`ok` integer NOT NULL,
	CONSTRAINT "tx_assert_ok_check" CHECK("tx_assert"."ok" = 1)
);
