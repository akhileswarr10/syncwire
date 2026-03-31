-- Create custom ENUM types for PostgreSQL
DO $$ BEGIN
    CREATE TYPE email_status_enum AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'extension_requested', 'extended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Meetings table (schema-primary-keys: use IDENTITY over SERIAL)
CREATE TABLE IF NOT EXISTS meetings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    summary text,
    transcript text,
    date timestamptz NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

-- Tasks table (schema-primary-keys, schema-data-types, schema-foreign-key-indexes)
CREATE TABLE IF NOT EXISTS tasks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meeting_id bigint REFERENCES meetings(id) ON DELETE CASCADE,
    assignee_email text,
    description text,
    detailed_context text,
    deadline timestamptz,
    email_status email_status_enum DEFAULT 'pending',
    task_status task_status_enum DEFAULT 'pending',
    magic_token text,
    calendar_event_id text,
    reason_for_delay text,
    requested_deadline timestamptz
);

-- Indexes (query-missing-indexes, schema-foreign-key-indexes)
-- FK index: 10-100x faster JOINs and CASCADE operations
CREATE INDEX IF NOT EXISTS tasks_meeting_id_idx ON tasks (meeting_id);

-- WHERE clause indexes: magic_token is used for lookups in every magic link request
CREATE INDEX IF NOT EXISTS tasks_magic_token_idx ON tasks (magic_token);

-- task_status is used for filtering in the archive view
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (task_status);
