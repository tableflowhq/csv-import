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

		create index if not exists thirdparty_users_user_id_idx on thirdparty_users(user_id);
		create or replace view users as (
		    with
		        all_users as (
		            select users.user_id        as id
		                 , users.email
		                 , users.time_joined
		                 , users.third_party_id as recipe
		            from thirdparty_users users
		            union all
		            select users.user_id as id
		                 , users.email
		                 , users.time_joined
		                 , 'email'       as recipe
		            from emailpassword_users users
		        )
		    select all_users.id
		         , all_users.email
		         , all_users.time_joined
		         , roles.role
		         , all_users.recipe
		    from all_users
		         left join user_roles roles on all_users.id = roles.user_id
		);

		create table if not exists organizations (
		    id         uuid primary key         not null default gen_random_uuid(),
		    name       text                     not null,
		    created_by uuid                     not null,
		    created_at timestamp with time zone not null,
		    updated_by uuid                     not null,
		    updated_at timestamp with time zone not null,
		    deleted_by uuid,
		    deleted_at timestamp with time zone
		);

		create table if not exists workspaces (
		    id              uuid primary key         not null default gen_random_uuid(),
		    organization_id uuid                     not null,
		    name            text                     not null,
		    api_key         text                     not null default concat('tf_', replace(gen_random_uuid()::text, '-', '')),
		    created_by      uuid                     not null,
		    created_at      timestamp with time zone not null,
		    updated_by      uuid                     not null,
		    updated_at      timestamp with time zone not null,
		    deleted_by      uuid,
		    deleted_at      timestamp with time zone,
		    constraint fk_organization_id
		        foreign key (organization_id)
		            references organizations(id)
		);
		create index if not exists workspaces_organization_id_idx on workspaces(organization_id);
		create unique index if not exists workspaces_api_key_idx on workspaces(api_key);

		create table if not exists organization_users (
		    organization_id uuid not null,
		    user_id         uuid not null,
		    primary key (organization_id, user_id),
		    constraint fk_organization_id
		        foreign key (organization_id)
		            references organizations(id)
		            on delete cascade
		            on update no action
		);
		create index if not exists organization_users_organization_id_idx on organization_users(organization_id);
		create index if not exists organization_users_user_id_idx on organization_users(user_id);

		create table if not exists workspace_users (
		    workspace_id uuid not null,
		    user_id      uuid not null,
		    primary key (workspace_id, user_id),
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id)
		            on delete cascade
		            on update no action
		);
		create index if not exists workspace_users_workspace_id_idx on workspace_users(workspace_id);
		create index if not exists workspace_users_user_id_idx on workspace_users(user_id);

		create table if not exists importers (
		    id              uuid primary key         not null default gen_random_uuid(),
		    workspace_id    uuid                     not null,
		    name            text                     not null,
		    allowed_domains text[]                   not null,
		    webhook_url     text,
		    created_by      uuid                     not null,
		    created_at      timestamp with time zone not null,
		    updated_by      uuid                     not null,
		    updated_at      timestamp with time zone not null,
		    deleted_by      uuid,
		    deleted_at      timestamp with time zone,
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id)
		);
		create index if not exists importers_workspace_id_created_at_idx on importers(workspace_id, created_at);

		create table if not exists templates (
		    id           uuid primary key         not null default gen_random_uuid(),
		    workspace_id uuid                     not null,
		    importer_id  uuid                     not null,
		    name         text                     not null,
		    created_by   uuid                     not null,
		    created_at   timestamp with time zone not null,
		    updated_by   uuid                     not null,
		    updated_at   timestamp with time zone not null,
		    deleted_by   uuid,
		    deleted_at   timestamp with time zone,
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id),
		    constraint fk_importer_id_id
		        foreign key (importer_id)
		            references importers(id)
		);
		create index if not exists templates_workspace_id_created_at_idx on templates(workspace_id, created_at);
		create unique index if not exists templates_importer_id_idx on templates(importer_id) where (deleted_at is null);

		create table if not exists template_columns (
		    id          uuid primary key         not null default gen_random_uuid(),
		    template_id uuid                     not null,
		    name        text                     not null,
		    key         text                     not null,
		    required    bool                     not null default false,
		    created_by  uuid                     not null,
		    created_at  timestamp with time zone not null,
		    updated_by  uuid                     not null,
		    updated_at  timestamp with time zone not null,
		    deleted_by  uuid,
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
		    workspace_id   uuid             not null,
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
		            references importers(id),
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id)
		);
		create unique index if not exists uploads_tus_id_idx on uploads(tus_id);
		create index if not exists uploads_workspace_id_created_at_idx on uploads(workspace_id, created_at);
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
		    workspace_id         uuid             not null,
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
		            references importers(id),
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id)
		);
		create index if not exists imports_workspace_id_created_at_idx on imports(workspace_id, created_at);
		create index if not exists imports_importer_id_idx on imports(importer_id);

		create table if not exists workspace_limits (
		    id               uuid primary key not null default gen_random_uuid(),
		    workspace_id     uuid             not null,
		    users            int,
		    importers        int,
		    files            int,
		    rows             int,
		    rows_per_import  int,
		    processed_values int,
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id)
		);
		create index if not exists workspace_limits_workspace_id_idx on workspace_limits(workspace_id);

		create table if not exists workspace_limit_triggers (
		    id                 uuid primary key         not null default gen_random_uuid(),
		    workspace_id       uuid                     not null,
		    workspace_limit_id uuid                     not null,
		    upload_id          uuid,
		    limit_type         text                     not null,
		    current_value      bigint                   not null,
		    limit_value        bigint                   not null,
		    blocked            bool                     not null default false,
		    created_at         timestamp with time zone not null,
		    constraint fk_workspace_id
		        foreign key (workspace_id)
		            references workspaces(id),
		    constraint fk_workspace_limit_id
		        foreign key (workspace_limit_id)
		            references workspace_limits(id),
		    constraint fk_upload_id
		        foreign key (upload_id)
		            references uploads(id)
		);
		create index if not exists workspace_limit_triggers_workspace_id_created_at_idx on workspace_limit_triggers(workspace_id, created_at);
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
