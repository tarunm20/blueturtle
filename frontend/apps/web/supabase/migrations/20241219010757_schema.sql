/*
 * -------------------------------------------------------
 * Supabase SaaS Starter Kit Schema
 * This is the schema for the Supabase SaaS Starter Kit.
 * It includes the schema for accounts
 * -------------------------------------------------------
 */
/*
 * -------------------------------------------------------
 * Section: Revoke default privileges from public schema
 * We will revoke all default privileges from public schema on functions to prevent public access to them
 * -------------------------------------------------------
 */
-- Create a private Makerkit schema
create schema if not exists kit;

create extension if not exists "unaccent" schema kit;

-- We remove all default privileges from public schema on functions to
--   prevent public access to them
alter default privileges
    revoke
    execute on functions
    from
    public;

revoke all on schema public
    from
    public;

revoke all PRIVILEGES on database "postgres"
    from
    "anon";

revoke all PRIVILEGES on schema "public"
    from
    "anon";

revoke all PRIVILEGES on schema "storage"
    from
    "anon";

revoke all PRIVILEGES on all SEQUENCES in schema "public"
    from
    "anon";

revoke all PRIVILEGES on all SEQUENCES in schema "storage"
    from
    "anon";

revoke all PRIVILEGES on all FUNCTIONS in schema "public"
    from
    "anon";

revoke all PRIVILEGES on all FUNCTIONS in schema "storage"
    from
    "anon";

revoke all PRIVILEGES on all TABLES in schema "public"
    from
    "anon";

revoke all PRIVILEGES on all TABLES in schema "storage"
    from
    "anon";

-- We remove all default privileges from public schema on functions to
--   prevent public access to them by default
alter default privileges in schema public
    revoke
    execute on functions
    from
    anon,
    authenticated;

-- we allow the authenticated role to execute functions in the public schema
grant usage on schema public to authenticated;

-- we allow the service_role role to execute functions in the public schema
grant usage on schema public to service_role;

/*
 * -------------------------------------------------------
 * Section: Accounts
 * We create the schema for the accounts. Accounts are the top level entity in the Supabase MakerKit. They can be team or personal accounts.
 * -------------------------------------------------------
 */
-- Accounts table
create table if not exists
    public.accounts
(
    id          uuid unique  not null default extensions.uuid_generate_v4(),
    name        varchar(255) not null,
    email       varchar(320) unique,
    updated_at  timestamp with time zone,
    created_at  timestamp with time zone,
    created_by  uuid references auth.users,
    updated_by  uuid references auth.users,
    picture_url varchar(1000),
    public_data jsonb                 default '{}'::jsonb not null,
    primary key (id)
);

comment on table public.accounts is 'Accounts are the top level entity in the Supabase MakerKit';

comment on column public.accounts.name is 'The name of the account';

comment on column public.accounts.email is 'The email of the account. For teams, this is the email of the team (if any)';

comment on column public.accounts.picture_url is 'The picture url of the account';

comment on column public.accounts.public_data is 'The public data of the account. Use this to store any additional data that you want to store for the account';

comment on column public.accounts.updated_at is 'The timestamp when the account was last updated';

comment on column public.accounts.created_at is 'The timestamp when the account was created';

comment on column public.accounts.created_by is 'The user who created the account';

comment on column public.accounts.updated_by is 'The user who last updated the account';

-- Enable RLS on the accounts table
alter table "public"."accounts"
    enable row level security;

-- SELECT(accounts):
-- Users can read their own accounts
create policy accounts_read on public.accounts for
    select
    to authenticated using (
        (select auth.uid()) = id
    );

-- UPDATE(accounts):
-- Users can update their own accounts
create policy accounts_update on public.accounts
    for update
    to authenticated using (
        (select auth.uid()) = id
    )
    with
    check (
        (select auth.uid()) = id
    );

-- Revoke all on accounts table from authenticated and service_role
revoke all on public.accounts
    from
    authenticated,
    service_role;

-- Open up access to accounts
grant
    select
    ,
    insert,
    update,
    delete on table public.accounts to authenticated,
    service_role;

-- Function "kit.protect_account_fields"
-- Function to protect account fields from being updated by anyone
create
    or replace function kit.protect_account_fields() returns trigger as
$$
begin
    if current_user in ('authenticated', 'anon') then
        if new.id <> old.id or new.email <> old.email then
            raise exception 'You do not have permission to update this field';

        end if;

    end if;

    return NEW;

end
$$ language plpgsql
    set
        search_path = '';

-- trigger to protect account fields
create trigger protect_account_fields
    before
        update
    on public.accounts
    for each row
execute function kit.protect_account_fields();

-- create a trigger to update the account email when the primary owner email is updated
create
    or replace function kit.handle_update_user_email() returns trigger
    language plpgsql
    security definer
    set
        search_path = '' as
$$
begin
    update
        public.accounts
    set email = new.email
    where id = new.id;

    return new;

end;

$$;

-- trigger the function every time a user email is updated only if the user is the primary owner of the account and
-- the account is personal account
create trigger "on_auth_user_updated"
    after
        update of email
    on auth.users
    for each row
execute procedure kit.handle_update_user_email();

-- Function "kit.new_user_created_setup"
-- Setup a new user account after user creation
create
    or replace function kit.new_user_created_setup() returns trigger
    language plpgsql
    security definer
    set
        search_path = '' as
$$
declare
    user_name   text;
    picture_url text;
begin
    if new.raw_user_meta_data ->> 'name' is not null then
        user_name := new.raw_user_meta_data ->> 'name';

    end if;

    if user_name is null and new.email is not null then
        user_name := split_part(new.email, '@', 1);

    end if;

    if user_name is null then
        user_name := '';

    end if;

    if new.raw_user_meta_data ->> 'avatar_url' is not null then
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    else
        picture_url := null;
    end if;

    insert into public.accounts(id,
                                name,
                                picture_url,
                                email)
    values (new.id,
            user_name,
            picture_url,
            new.email);

    return new;

end;

$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure kit.new_user_created_setup();

-- Storage
-- Account Image
insert into storage.buckets (id, name, PUBLIC)
values ('account_image', 'account_image', true);

-- Function: get the storage filename as a UUID.
-- Useful if you want to name files with UUIDs related to an account
create
    or replace function kit.get_storage_filename_as_uuid(name text) returns uuid
    set
        search_path = '' as
$$
begin
    return replace(storage.filename(name), concat('.',
                                                  storage.extension(name)), '')::uuid;

end;

$$ language plpgsql;

grant
    execute on function kit.get_storage_filename_as_uuid (text) to authenticated,
    service_role;

-- RLS policies for storage bucket account_image
create policy account_image on storage.objects for all using (
    bucket_id = 'account_image'
        and (
        kit.get_storage_filename_as_uuid(name) = auth.uid()
        )
    )
    with
    check (
    bucket_id = 'account_image'
        and (
        kit.get_storage_filename_as_uuid(name) = auth.uid()
        )
    );

<<<<<<< HEAD
-- STEP 1: Check if accounts table exists, create if it doesn't
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users,
  picture_url VARCHAR(1000),
  public_data JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- STEP 2: Create the DB Connections Table
CREATE TABLE IF NOT EXISTS public.db_connections (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  db_type TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- STEP 3: Create the Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  model_type TEXT,
  model_config JSONB DEFAULT '{}'::jsonb,
  db_connection_id UUID REFERENCES public.db_connections(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- STEP 4: Create the Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sql TEXT,
  result JSONB,
  tokens_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- STEP 5: Update the Accounts Table with chat-related fields
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS 
  chat_preferences JSONB DEFAULT '{
    "default_model": "llama3.2",
    "message_history_limit": 50,
    "show_sql_by_default": true,
    "theme": "default",
    "notifications_enabled": true
  }'::jsonb;
  
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS monthly_token_usage INTEGER DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS monthly_query_count INTEGER DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now());
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS chat_onboarded BOOLEAN DEFAULT false;

-- STEP 6: Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_db_connections_user_id ON public.db_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_db_connections_last_used_at ON public.db_connections(last_used_at);

-- STEP 7: Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_connections ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
  ON public.conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
  ON public.conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
  ON public.conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- STEP 9: Create RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to their conversations" 
  ON public.messages FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages in their conversations" 
  ON public.messages FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages in their conversations" 
  ON public.messages FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  ));

-- STEP 10: Create RLS Policies for db_connections
CREATE POLICY "Users can view their own database connections" 
  ON public.db_connections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own database connections" 
  ON public.db_connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own database connections" 
  ON public.db_connections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own database connections" 
  ON public.db_connections FOR DELETE 
  USING (auth.uid() = user_id);

-- STEP 11: Create function for token usage tracking
CREATE OR REPLACE FUNCTION public.update_token_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update token usage
  UPDATE public.accounts
  SET monthly_token_usage = monthly_token_usage + NEW.tokens_used,
      monthly_query_count = monthly_query_count + CASE WHEN NEW.sql IS NOT NULL THEN 1 ELSE 0 END
  WHERE id = (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id);
  
  -- Reset if we're in a new month
  UPDATE public.accounts
  SET monthly_token_usage = NEW.tokens_used,
      monthly_query_count = CASE WHEN NEW.sql IS NOT NULL THEN 1 ELSE 0 END,
      monthly_reset_date = date_trunc('month', now())
  WHERE id = (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id)
    AND monthly_reset_date < date_trunc('month', now());
    
  -- Update last active timestamp
  UPDATE public.accounts
  SET last_active_at = NOW()
  WHERE id = (SELECT user_id FROM public.conversations WHERE id = NEW.conversation_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for token usage tracking
DROP TRIGGER IF EXISTS trig_update_token_usage ON public.messages;
CREATE TRIGGER trig_update_token_usage
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.role = 'assistant')
EXECUTE FUNCTION public.update_token_usage();

-- STEP 12: Create function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
=======
-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id UUID REFERENCES public.chat_sessions NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', or 'system'
  content TEXT NOT NULL,
  sql TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a table for query results
CREATE TABLE IF NOT EXISTS public.query_results (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  message_id UUID REFERENCES public.chat_messages NOT NULL,
  columns JSONB,
  rows JSONB,
  visualization JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_results ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only access their own data
CREATE POLICY chat_sessions_policy ON public.chat_sessions 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY chat_messages_policy ON public.chat_messages 
  FOR ALL TO authenticated 
  USING ((SELECT user_id FROM public.chat_sessions WHERE id = session_id) = auth.uid());

CREATE POLICY query_results_policy ON public.query_results 
  FOR ALL TO authenticated 
  USING ((SELECT user_id FROM public.chat_sessions WHERE id = (SELECT session_id FROM public.chat_messages WHERE id = message_id)) = auth.uid());

-- Add trigger to update updated_at when messages are added
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
>>>>>>> dev
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

<<<<<<< HEAD
-- Create trigger for conversation timestamp updates
DROP TRIGGER IF EXISTS trig_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trig_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- STEP 13: Set up realtime for messages
BEGIN;
  -- Drop and recreate the supabase_realtime publication if it doesn't exist
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
=======
CREATE TRIGGER update_chat_session_timestamp
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_timestamp();

>>>>>>> dev
