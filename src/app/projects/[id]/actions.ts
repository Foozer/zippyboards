'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

export async function addProjectMemberAction(
  projectId: string,
  email: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const adminSupabase = getSupabaseAdminClient()

  try {
    // 1. Get current user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return { success: false, error: 'Authentication required.' }
    }

    // 2. Check if current user is project owner
    const { data: ownerCheck, error: ownerCheckError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUser.id)
      .single()

    if (ownerCheckError || ownerCheck?.role !== 'owner') {
      return { success: false, error: 'Permission denied: Only project owners can add members.' }
    }

    // 3. Find the user to add by email using Admin client
    // ListUsers API doesn't directly filter by email, we fetch and filter.
    // Use a specific query if the API evolves or if you have a custom function.
    const { data: listUsersData, error: listUsersError } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Fetch a reasonable batch, adjust if needed
    })

    if (listUsersError) {
      console.error('Admin API error listing users:', listUsersError)
      return { success: false, error: 'Error finding user.' }
    }

    // Find the user in the returned list
    const targetUser = listUsersData?.users.find(u => u.email === email)

    if (!targetUser) {
      return { success: false, error: 'User with this email not found.' }
    }

    // 4. Check if user is already a member
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existingMemberError) {
      return { success: false, error: 'Error checking existing membership.' }
    }
    if (existingMember) {
      return { success: false, error: 'User is already a member of this project.' }
    }

    // 5. Add the new member using the Admin Client to bypass potential RLS insert restrictions
    const { error: insertError } = await adminSupabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role: 'member'
      })

    if (insertError) {
      console.error('Error inserting project member (using admin):', insertError)
      // Provide more specific error if possible
      return { success: false, error: `Failed to add member: ${insertError.message}` }
    }

    // 6. Revalidate the project page path to show the new member
    revalidatePath(`/projects/${projectId}`)

    return { success: true }

  } catch (error) {
    console.error('Unexpected error in addProjectMemberAction:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

export async function removeProjectMemberAction(
  projectId: string,
  userIdToRemove: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const adminSupabase = getSupabaseAdminClient()

  try {
    // 1. Get current user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return { success: false, error: 'Authentication required.' }
    }

    // 2. Check if current user is project owner
    const { data: ownerCheck, error: ownerCheckError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUser.id)
      .single()

    if (ownerCheckError || ownerCheck?.role !== 'owner') {
      return { success: false, error: 'Permission denied: Only project owners can remove members.' }
    }

    // Prevent owner from removing themselves (optional, but good practice)
    if (currentUser.id === userIdToRemove) {
      return { success: false, error: 'Project owners cannot remove themselves.' }
    }

    // 3. Remove the member using Admin Client (to bypass RLS if necessary)
    const { error: deleteError } = await adminSupabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userIdToRemove)

    if (deleteError) {
      console.error('Error deleting project member (using admin):', deleteError)
      return { success: false, error: `Failed to remove member: ${deleteError.message}` }
    }

    // 4. Revalidate the path
    revalidatePath(`/projects/${projectId}`)

    return { success: true }

  } catch (error) {
    console.error('Unexpected error in removeProjectMemberAction:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
} 