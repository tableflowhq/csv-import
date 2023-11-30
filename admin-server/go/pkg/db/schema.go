package db

func GetDatabaseSchemaInitSQL() string {
	return `
		create table if not exists instance_id (
			id          uuid primary key not null,
			initialized bool unique      not null default true,
			constraint initialized check (initialized)
		);
		insert into instance_id (id)
		values (gen_random_uuid())
		on conflict do nothing;

		create table if not exists uploads (
			id                       uuid primary key not null default gen_random_uuid(),
			tus_id                   varchar(32)      not null,
			file_name                text,
			file_type                text,
			file_extension           text,
			file_size                bigint,
			num_rows                 int,
			num_columns              int,
			metadata                 jsonb            not null default '{}'::jsonb, -- Optional custom data the client can send from the SDK, i.e. their user ID
			template                 jsonb,
			is_stored                bool             not null default false,       -- Have all the records been stored?
			schemaless               bool             not null default false,
			header_row_index         integer,
			matched_header_row_index integer,
			sheet_list               text[],
			error                    text,
			created_at               timestamptz      not null default now(),
			updated_at               timestamptz      not null default now()
		);
		create unique index if not exists uploads_tus_id_idx on uploads(tus_id);

		create table if not exists upload_columns (
			id                 uuid primary key not null default gen_random_uuid(),
			upload_id          uuid             not null,
			name               text             not null,
			index              int              not null, -- The 0-based position of the column within the file
			sample_data        text[]           not null,
			unique (upload_id, index),
			constraint fk_upload_id
				foreign key (upload_id)
					references uploads(id)
		);
		create index if not exists upload_columns_upload_id_idx on upload_columns(upload_id);

		create table if not exists imports (
			id                   uuid primary key not null default gen_random_uuid(),
			upload_id            uuid             not null,
			num_rows             int,
			num_columns          int,
			num_processed_values int,
			metadata             jsonb            not null default '{}'::jsonb, -- Optional custom data the client can send from the SDK, i.e. their user ID
			is_stored            bool             not null default false,       -- Have all the records been stored?
			is_complete          boolean                   default false not null,
			num_error_rows       integer,
			num_valid_rows       integer,
			data_types           jsonb,
			created_at           timestamptz      not null default now(),
			updated_at           timestamptz      not null default now(),
			deleted_at           timestamptz,
			constraint fk_upload_id
				foreign key (upload_id)
					references uploads(id)
		);
		create index if not exists imports_created_at_idx on imports(created_at);
		create unique index if not exists imports_upload_id_deleted_at_idx on imports(upload_id) where (deleted_at is null);
	`
}
