import type { Database, Profile, Article, Follow, Comment } from '../src/lib/supabase/types'
import { createClient as createBrowserClient } from '../src/lib/supabase/client'
import { createClient as createServerClient } from '../src/lib/supabase/server'

function assertTypeCompatibility(
  db: Database,
  profile: Profile,
  article: Article,
  follow: Follow,
  comment: Comment
) {
  return [
    db.public.Tables.profiles.Row.id,
    profile.username,
    article.title,
    follow.follower_id,
    comment.content,
  ]
}

export function testSupabaseClientSignatures() {
  const browserClient = createBrowserClient
  const serverClient = createServerClient
  const fields = assertTypeCompatibility(
    { public: { Tables: { profiles: { Row: { id: 'test' } } } } } as unknown as Database,
    { username: 'test' } as unknown as Profile,
    { title: 'test' } as unknown as Article,
    { follower_id: 'test' } as unknown as Follow,
    { content: 'test' } as unknown as Comment
  )
  return { browserClient, serverClient, fields }
}
