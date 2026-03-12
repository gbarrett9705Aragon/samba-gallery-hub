-- Create the clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on clubs
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Create the club_members table
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(club_id, user_id)
);

-- Enable RLS on club_members
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Create the invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    email TEXT, -- Optional, if you want to invite by email specifically
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')) DEFAULT 'Member',
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Expired')) DEFAULT 'Pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------
-- RENAME AND UPDATE EXISTING TABLES
-----------------------------------------------------

-- Rename tee_times to sessions
ALTER TABLE IF EXISTS tee_times RENAME TO sessions;

-- Rename tee_time_signups to session_signups
ALTER TABLE IF EXISTS tee_time_signups RENAME TO session_signups;

-- Rename columns in session_signups
ALTER TABLE IF EXISTS session_signups RENAME COLUMN tee_time_id TO session_id;


-- Add club_id to existing tables (with temporary NULL allowed, then make NOT NULL if needed, but for now we'll allow NULL during migration)
ALTER TABLE players ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE session_signups ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE announcements ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE calendar ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;


-----------------------------------------------------
-- RLS POLICIES
-----------------------------------------------------

-- Clubs: Users can view clubs they are members of
CREATE POLICY "Users can view their clubs"
ON clubs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
    )
);

-- Club Members: Users can view members of their clubs
CREATE POLICY "Users can view members of their clubs"
ON club_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM club_members AS cm
        WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
    )
);

-- Invitations: Admins can view/create invitations for their clubs
CREATE POLICY "Admins can manage invitations"
ON invitations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = invitations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'Admin'
    )
);

-- Invitations: Anyone can read an invitation by its token (used during join flow)
CREATE POLICY "Anyone can read an invitation by token"
ON invitations FOR SELECT
USING (true);

-- Update RLS for existing tables (assuming policies existed, they need to be recreated or updated to check club_id)
-- For example, users can only view sessions in their club:
-- DROP POLICY IF EXISTS "View sessions" ON sessions;
-- CREATE POLICY "Users can view sessions in their clubs"
-- ON sessions FOR SELECT
-- USING (
--     EXISTS (
--         SELECT 1 FROM club_members
--         WHERE club_members.club_id = sessions.club_id
--         AND club_members.user_id = auth.uid()
--     )
-- );
-- (You will need to update the rest of your table policies similarly in Supabase).
