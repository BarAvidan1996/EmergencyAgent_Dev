-- Drop the table if it exists (be careful with this in production!)
drop table if exists users;

-- Create the users table
create table users (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    first_name text,
    last_name text,
    phone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table users enable row level security;

-- Create policies
create policy "Users can read own data" on users
    for select using (auth.uid() = id);

create policy "Users can update own data" on users
    for update using (auth.uid() = id);

create policy "Users can insert own data" on users
    for insert with check (auth.uid() = id);

-- Grant access to authenticated users
grant all on users to authenticated; 