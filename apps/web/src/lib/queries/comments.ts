import { createClient } from '@/lib/supabase/client'

export type CommentEntity = 'athlete' | 'group'
export type CommentVisibility = 'staff' | 'shared'

export interface CommentRow {
  id: string
  entity_type: CommentEntity
  entity_id: string
  body: string
  visibility: CommentVisibility
  created_at: string
  updated_at: string
  author_id: string
  author_name: string
}

export async function getComments(
  entityType: CommentEntity,
  entityId: string
): Promise<CommentRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:author_id(first_name, last_name)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map(row => {
    const a = row.author as { first_name?: string; last_name?: string } | null
    return {
      id: row.id as string,
      entity_type: row.entity_type as CommentEntity,
      entity_id: row.entity_id as string,
      body: row.body as string,
      visibility: row.visibility as CommentVisibility,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      author_id: row.author_id as string,
      author_name: a ? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || 'Usuario' : 'Usuario',
    }
  })
}

export async function addComment(params: {
  entityType: CommentEntity
  entityId: string
  body: string
  visibility: CommentVisibility
}) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id
  if (!tenantId) throw new Error('Tu cuenta no tiene organización asignada.')

  // author_id referencia users.id (id publico), no el id de auth.
  const { data: publicUser, error: uErr } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userRes.user.id)
    .maybeSingle()
  if (uErr) throw uErr
  if (!publicUser) {
    throw new Error('Tu cuenta de acceso no está vinculada a un perfil de usuario.')
  }

  const { error } = await supabase.from('comments').insert({
    tenant_id: tenantId,
    author_id: publicUser.id,
    entity_type: params.entityType,
    entity_id: params.entityId,
    body: params.body.trim(),
    visibility: params.visibility,
  })
  if (error) throw error
}

export async function updateComment(
  id: string,
  updates: { body?: string; visibility?: CommentVisibility }
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteComment(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
