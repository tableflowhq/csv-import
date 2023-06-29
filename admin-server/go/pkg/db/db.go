package db

import (
	"errors"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
	"tableflow/go/pkg/util"
)

var DB *gorm.DB
var dbInitialized bool
var OpenModelOmitFields = []string{"WorkspaceID", "CreatedBy", "UpdatedBy", "DeletedBy"}

func InitDatabase() error {
	if dbInitialized {
		return errors.New("db already initialized")
	}
	dbInitialized = true
	var err error
	// TODO: Add timezone support
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=America/Los_Angeles",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DATABASE_NAME"))
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	if err = DB.Exec(getDatabaseInitSQL()).Error; err != nil {
		util.Log.Errorw("Error running database initialization SQL", "error", err)
		return err
	}
	return nil
}

func getDatabaseInitSQL() string {
	return `
		create table if not exists instance_id (
		    id          uuid primary key not null,
		    initialized bool unique      not null default true,
		    constraint initialized check (initialized)
		);
		insert into instance_id (id) values (gen_random_uuid()) on conflict do nothing;

		create table if not exists settings (
		    initialized bool primary key         not null default true,
		    api_key     text                     not null default concat('tf_', replace(gen_random_uuid()::text, '-', '')),
		    created_at  timestamp with time zone not null default now(),
		    constraint initialized check (initialized)
		);
		insert into settings select on conflict do nothing;

		create table if not exists importers (
		    id              uuid primary key         not null default gen_random_uuid(),
		    name            text                     not null,
		    allowed_domains text[]                   not null,
		    webhook_url     text,
		    created_at      timestamp with time zone not null,
		    updated_at      timestamp with time zone not null,
		    deleted_at      timestamp with time zone
		);
		create index if not exists importers_created_at_idx on importers(created_at);

		create table if not exists templates (
		    id           uuid primary key         not null default gen_random_uuid(),
		    importer_id  uuid                     not null,
		    name         text                     not null,
		    created_at   timestamp with time zone not null,
		    updated_at   timestamp with time zone not null,
		    deleted_at   timestamp with time zone,
		    constraint fk_importer_id_id
		        foreign key (importer_id)
		            references importers(id)
		);
		create index if not exists templates_created_at_idx on templates(created_at);
		create unique index if not exists templates_importer_id_idx on templates(importer_id) where (deleted_at is null);

		create table if not exists template_columns (
		    id          uuid primary key         not null default gen_random_uuid(),
		    template_id uuid                     not null,
		    name        text                     not null,
		    key         text                     not null,
		    required    bool                     not null default false,
		    created_at  timestamp with time zone not null,
		    updated_at  timestamp with time zone not null,
		    deleted_at  timestamp with time zone,
		    constraint fk_template_id
		        foreign key (template_id)
		            references templates(id)
		);
		create unique index if not exists template_columns_template_id_key_idx on template_columns(template_id, key) where (deleted_at is null);

		create table if not exists uploads (
		    id             uuid primary key not null default gen_random_uuid(),
		    tus_id         varchar(32)      not null,
		    importer_id    uuid             not null,
		    file_name      text,
		    file_type      text,
		    file_extension text,
		    file_size      bigint,
		    num_rows       int,
		    num_columns    int,
		    metadata       jsonb            not null default '{}'::jsonb, -- Optional custom data the client can send from the SDK, i.e. their user ID
		    is_parsed      bool             not null default false,       -- Are the upload_columns created and ready for the user to map?
		    is_stored      bool             not null default false,       -- Has the file been uploaded to S3?
		    storage_bucket text,
		    error          text,
		    created_at     timestamptz      not null default now(),
		    constraint fk_importer_id
		        foreign key (importer_id)
		            references importers(id)
		);
		create unique index if not exists uploads_tus_id_idx on uploads(tus_id);
		create index if not exists uploads_created_at_idx on uploads(created_at);
		create index if not exists uploads_importer_id_idx on uploads(importer_id);

		create table if not exists upload_columns (
		    id                 uuid primary key not null default gen_random_uuid(),
		    upload_id          uuid             not null,
		    name               text             not null,
		    index              int              not null, -- The 0-based position of the column within the file
		    sample_data        text[]           not null,
		    template_column_id uuid,                      -- The ID of the template_column this column will map to when importing
		    unique (upload_id, index),
		    constraint fk_upload_id
		        foreign key (upload_id)
		            references uploads(id),
		    constraint fk_template_column_id
		        foreign key (template_column_id)
		            references template_columns(id)
		);
		create index if not exists upload_columns_upload_id_idx on upload_columns(upload_id);

		create table if not exists imports (
		    id                   uuid primary key not null default gen_random_uuid(),
		    upload_id            uuid             not null,
		    importer_id          uuid             not null,
		    file_type            text,
		    file_extension       text,
		    file_size            bigint,
		    num_rows             int,
		    num_columns          int,
		    num_processed_values int,
		    metadata             jsonb            not null default '{}'::jsonb, -- Optional custom data the client can send from the SDK, i.e. their user ID
		    is_stored            bool             not null default false,       -- Has the file been uploaded to S3?
		    storage_bucket       text,
		    created_at           timestamptz      not null default now(),
		    constraint fk_upload_id
		        foreign key (upload_id)
		            references uploads(id),
		    constraint fk_importer_id
		        foreign key (importer_id)
		            references importers(id)
		);
		create index if not exists imports_created_at_idx on imports(created_at);
		create index if not exists imports_importer_id_idx on imports(importer_id);
	`
}

func GetInstanceID() (string, error) {
	type res struct {
		ID string
	}
	result := res{}
	err := DB.Raw("select id from instance_id").Scan(&result).Error
	return result.ID, err
}
