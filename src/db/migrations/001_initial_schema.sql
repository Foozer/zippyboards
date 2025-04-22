-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;

-- Create custom types
CREATE TYPE task_status AS ENUM ('backlog', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create projects table
DROP TABLE IF EXISTS public.projects CASCADE; -- Added CASCADE for safety if resetting
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create labels table
DROP TABLE IF EXISTS public.labels CASCADE;
CREATE TABLE public.labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, project_id)
);

-- Create tasks table
DROP TABLE IF EXISTS public.tasks CASCADE;
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'backlog',
    priority task_priority NOT NULL DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    github_issue_id INTEGER,
    github_repo_id INTEGER
);

-- Create task_labels junction table
DROP TABLE IF EXISTS public.task_labels CASCADE;
CREATE TABLE public.task_labels (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Create project_members table
DROP TABLE IF EXISTS public.project_members CASCADE;
CREATE TABLE public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- Ensure 'owner' is used by function
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Create github_sync table
DROP TABLE IF EXISTS public.github_sync CASCADE;
CREATE TABLE public.github_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    github_repo_id INTEGER NOT NULL,
    github_repo_name VARCHAR(255) NOT NULL,
    github_owner VARCHAR(255) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, github_repo_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_project_id ON public.labels(project_id);

-- Create SECURITY DEFINER function for initial owner insert
DROP FUNCTION IF EXISTS public.add_project_owner_member(UUID, UUID);
CREATE OR REPLACE FUNCTION public.add_project_owner_member(proj_id UUID, usr_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (proj_id, usr_id, 'owner');
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_project_owner_member(UUID, UUID) TO authenticated;


-- Set up Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY; -- Note: task_labels might need policies too
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_sync ENABLE ROW LEVEL SECURITY; -- Note: github_sync needs policies defined below

-- Create RLS policies

-- Projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they created or are members of" ON public.projects;

CREATE POLICY "Users can view projects they created or are members of"
    ON public.projects FOR SELECT
    USING (
        auth.uid() = created_by
        OR
        id IN (
            SELECT pm.project_id FROM public.project_members pm
            WHERE pm.user_id = auth.uid() AND pm.project_id = projects.id
        )
    );

CREATE POLICY "Users can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project members can update projects" -- Should likely be owners?
    ON public.projects FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM public.project_members pm_check
            WHERE pm_check.project_id = projects.id
              AND pm_check.user_id = auth.uid()
              AND pm_check.role = 'owner' -- Only owners can update project details
        )
    );

-- Tasks policies (Example - adjust as needed)
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;

CREATE POLICY "Project members can view tasks"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can update tasks"
    ON public.tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid()
        )
    ); -- Consider more specific roles for update/delete

-- Labels policies (Example)
DROP POLICY IF EXISTS "Project members can view labels" ON public.labels;
DROP POLICY IF EXISTS "Project members can manage labels" ON public.labels;

CREATE POLICY "Project members can view labels"
    ON public.labels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = labels.project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can manage labels" -- Consider splitting to owner/member roles
    ON public.labels FOR ALL -- Use split policies (INSERT/UPDATE/DELETE) in production
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = labels.project_id AND pm.user_id = auth.uid()
        )
    );

-- Project members policies (Final Version - NO INSERT policy)
DROP POLICY IF EXISTS "Project creators can insert initial owner" ON public.project_members;
DROP POLICY IF EXISTS "Project members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their own membership entries" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can delete project members" ON public.project_members;

-- Create the policy to allow project creators to insert themselves as owners
CREATE POLICY "Project creators can insert initial owner"
    ON public.project_members
    FOR INSERT
    WITH CHECK (
        -- Allow if the user is inserting themselves as owner
        (user_id = auth.uid() AND role = 'owner')
        AND
        -- And if they are the creator of the project
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_id
            AND created_by = auth.uid()
        )
    );

-- Simpler policy: Allow users to select their own membership entries directly.
-- This avoids self-referencing subqueries in the policy itself and works for the dashboard.
CREATE POLICY "Users can view their own membership entries"
   ON public.project_members FOR SELECT
   USING ( auth.uid() = user_id );

CREATE POLICY "Project owners can update project members"
    ON public.project_members FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM public.project_members pm_check
            WHERE pm_check.project_id = project_members.project_id
              AND pm_check.user_id = auth.uid()
              AND pm_check.role = 'owner'
        )
    ) WITH CHECK ( -- Optional: Re-check on update
         EXISTS (
            SELECT 1 FROM public.project_members pm_check
            WHERE pm_check.project_id = project_members.project_id
              AND pm_check.user_id = auth.uid()
              AND pm_check.role = 'owner'
        )
    );

CREATE POLICY "Project owners can delete project members"
    ON public.project_members FOR DELETE
    USING (
         EXISTS (
            SELECT 1 FROM public.project_members pm_check
            WHERE pm_check.project_id = project_members.project_id
              AND pm_check.user_id = auth.uid()
              AND pm_check.role = 'owner'
        )
        -- Add logic here if you don't want owners to delete themselves or the last owner
        -- AND project_members.user_id != auth.uid() ...
    );


-- GitHub sync policies (Example - adjust roles as needed)
DROP POLICY IF EXISTS "Project members can view github sync" ON public.github_sync;
DROP POLICY IF EXISTS "Project owners can manage github sync" ON public.github_sync;

CREATE POLICY "Project members can view github sync"
    ON public.github_sync FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = github_sync.project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage github sync" -- Split in production
    ON public.github_sync FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = github_sync.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'owner'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_github_sync_updated_at ON public.github_sync;
CREATE TRIGGER update_github_sync_updated_at
    BEFORE UPDATE ON public.github_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get project members, checking membership first
DROP FUNCTION IF EXISTS public.get_project_members_if_allowed(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_project_members_if_allowed(p_project_id UUID, p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    role VARCHAR(20),
    email VARCHAR(255)  -- Changed from TEXT to VARCHAR(255) to match auth.users.email type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_debug text;
BEGIN
    -- Log input parameters
    v_debug := format('Function called with project_id: %s, user_id: %s', p_project_id::text, p_user_id::text);
    RAISE NOTICE '%', v_debug;
    
    -- Validate inputs
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id cannot be null';
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be null';
    END IF;

    -- First, check if the project exists
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Check if the calling user is a member of the project
    IF EXISTS (
        SELECT 1
        FROM public.project_members pm
        WHERE pm.project_id = p_project_id 
        AND pm.user_id = p_user_id
    ) THEN
        -- Log successful membership check
        RAISE NOTICE 'User % is a member of project %', p_user_id, p_project_id;
        
        -- If they are a member, return all members with their emails
        RETURN QUERY
        SELECT
            pm.user_id,
            pm.role,
            u.email::VARCHAR(255)  -- Explicit cast to VARCHAR(255)
        FROM public.project_members pm
        JOIN auth.users u ON pm.user_id = u.id
        WHERE pm.project_id = p_project_id;
        
        -- Log query execution
        GET DIAGNOSTICS v_debug = ROW_COUNT;
        RAISE NOTICE 'Returned % rows', v_debug;
    ELSE
        -- Log failed membership check
        RAISE NOTICE 'User % is NOT a member of project %', p_user_id, p_project_id;
        RETURN;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log any errors
        RAISE NOTICE 'Error in get_project_members_if_allowed: %', SQLERRM;
        RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_members_if_allowed(UUID, UUID) TO authenticated; 