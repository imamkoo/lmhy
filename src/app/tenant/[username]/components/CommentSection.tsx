'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CommentWithAuthor } from '@/lib/comment-storage';
import { postCommentAction, deleteCommentAction } from '@/app/actions/community';

export interface CommentUser {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
}

export interface CommentSectionProps {
  articleId: string;
  creatorUsername: string;
  creatorId?: string;
  initialComments?: CommentWithAuthor[];
  currentUser?: CommentUser | null;
}

export function CommentSection({
  articleId,
  creatorUsername,
  creatorId,
  initialComments = [],
  currentUser,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const normalizedCreatorUsername = (creatorUsername || '').toLowerCase();

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    setFeedbackError(null);

    try {
      const res = await postCommentAction(articleId, content);

      if (!res.success || !res.comment) {
        setFeedbackError(res.error || 'Gagal mengirim komentar.');
        return;
      }

      setComments((prev) => [...prev, res.comment!]);
      setNewContent('');
    } catch (err: unknown) {
      console.error('[CommentSection] Error posting comment:', err);
      setFeedbackError(err instanceof Error ? err.message : 'Terjadi kendala jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId || deletingId) return;

    const confirmDelete = window.confirm('Hapus komentar refleksi ini?');
    if (!confirmDelete) return;

    setDeletingId(commentId);
    try {
      const res = await deleteCommentAction(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(res.error || 'Gagal menghapus komentar.');
      }
    } catch (err: unknown) {
      console.error('[CommentSection] Error deleting comment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-14 border-t border-slate-200/90 pt-10" id="refleksi-pembaca">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Tanggapan & Diskusi Pembaca
          </h3>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Ruang berbagi pemikiran, refleksi, dan apresiasi terhadap tulisan ini.
          </p>
        </div>
        {comments.length > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {comments.length} Komentar
          </span>
        )}
      </div>

      {/* Input Box / Invitation Form */}
      <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        {currentUser ? (
          <form onSubmit={handlePostComment} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#F7ABC5] text-xs font-bold text-[#3F3766]">
                {currentUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.display_name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {(currentUser.display_name || currentUser.username || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  {currentUser.display_name || `@${currentUser.username}`}
                </span>
                <span className="ml-1.5 text-slate-400">
                  menulis refleksi
                </span>
              </div>
            </div>

            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Tuliskan refleksi, tanggapan mendalam, atau kesan yang Anda rasakan setelah membaca tulisan ini..."
              maxLength={2000}
              className="w-full resize-y rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#F7ABC5] focus:outline-none focus:ring-2 focus:ring-[#F7ABC5]/20"
            />

            {feedbackError && (
              <p className="text-xs font-medium text-red-600">
                ⚠️ {feedbackError}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {newContent.length}/2000 karakter
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newContent.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F7ABC5] px-5 py-2 text-xs font-bold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim Refleksi</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 py-2 sm:flex-row text-center sm:text-left">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Ingin berbagi pandangan atau menyapa penulis?
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Masuk ke akun Anda untuk meninggalkan jejak refleksi dan berdialog bersama @{creatorUsername}.
              </p>
            </div>
            <Link
              href={`/login?next=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F7ABC5] px-5 py-2.5 text-xs font-bold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px]"
            >
              <span>Masuk untuk Berkomentar</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-8 text-center">
          <p className="text-2xl">🌱</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Belum ada refleksi untuk tulisan ini
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Jadilah pembaca pertama yang meninggalkan jejak resonansi batin di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const author = comment.author;
            const authorUsername = (author?.username || '').toLowerCase();
            const isCreator =
              Boolean(creatorId && comment.author_id === creatorId) ||
              Boolean(authorUsername && authorUsername === normalizedCreatorUsername);

            const isOwnComment = currentUser && currentUser.id === comment.author_id;

            const displayName = author?.display_name || author?.username || 'Pembaca Anonim';
            const initials = displayName.slice(0, 2).toUpperCase();

            const formattedDate = new Date(comment.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={comment.id}
                className={`rounded-2xl border p-4.5 transition sm:p-5 ${
                  isCreator
                    ? 'border-[#F7ABC5] bg-[#F5E7C6]/40'
                    : 'border-slate-200/90 bg-white shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Commenter Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#F7ABC5] text-xs font-bold text-[#3F3766] select-none">
                      {author?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {/* Metadata & Creator Badge */}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 sm:text-sm">
                          {displayName}
                        </span>
                        {author?.username && (
                          <span className="text-[11px] text-slate-400">
                            @{author.username}
                          </span>
                        )}
                        {isCreator && (
                          <span className="inline-flex items-center rounded-full bg-[#F7ABC5]/20 px-2 py-0.5 text-[10px] font-bold text-[#3F3766]">
                            Penulis
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Delete option if current user is comment author */}
                  {isOwnComment && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="text-xs text-slate-400 transition hover:text-red-600 disabled:opacity-50"
                      title="Hapus komentar Anda"
                    >
                      {deletingId === comment.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <div className="mt-3.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {comment.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
