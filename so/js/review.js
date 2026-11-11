/**
 * REVIEW CONTROLLER - SWISS EDITORIAL (SUPABASE CONNECTED)
 * Academic Archive - Sistem Operasi (2026)
 * Endru Aidil Fitriansyah (NIM 2503010054)
 */

(function () {
  'use strict';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const datePart = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      return datePart + ', ' + timePart + ' WIB';
    } catch {
      return isoString;
    }
  }

  async function initReviewPage() {
    const feedContainer = document.getElementById('review-feed-container');
    const filterSelect = document.getElementById('review-filter-assignment');
    const totalCountEl = document.getElementById('review-stat-total');
    const evaluatedTasksEl = document.getElementById('review-stat-tasks');
    const latestDateEl = document.getElementById('review-stat-latest');

    if (!feedContainer) return;

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    if (!client) return;

    feedContainer.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; border: var(--hairline); background: var(--surface); color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
        [MEMUAT KOMENTAR...]
      </div>
    `;

    try {
      // Ambil seluruh tugas untuk referensi dropdown & label
      const { data: assignments } = await client
        .from('assignments')
        .select('id, meeting, title')
        .order('meeting', { ascending: true });

      const taskMap = new Map();
      (assignments || []).forEach((a) => {
        taskMap.set(a.id, a);
      });

      // Ambil seluruh komentar (baik yang disetujui maupun belum)
      const { data: allComments, error } = await client
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        feedContainer.innerHTML = `
          <div style="padding: 48px 24px; text-align: center; border: var(--hairline); background: var(--surface); color: var(--accent); font-family: var(--font-mono); font-size: var(--text-small);">
            [GAGAL MEMUAT KOMENTAR: ${escapeHTML(error.message)}]
          </div>
        `;
        return;
      }

      const comments = allComments || [];

      // Filter Dropdown
      if (filterSelect) {
        filterSelect.innerHTML =
          `<option value="all">Semua Dokumen Tugas (${comments.length})</option>` +
          (assignments || [])
            .map((a) => {
              const count = comments.filter((c) => c.assignment_id === a.id).length;
              const meetPad = String(a.meeting).padStart(2, '0');
              return `<option value="${a.id}">Pertemuan ${meetPad}: ${escapeHTML(a.title)} (${count})</option>`;
            })
            .join('');
      }

      // Update Statistik
      if (totalCountEl) totalCountEl.textContent = comments.length;
      if (evaluatedTasksEl) {
        const distinctTasks = new Set(comments.map((c) => c.assignment_id));
        evaluatedTasksEl.textContent = distinctTasks.size;
      }
      if (latestDateEl) {
        latestDateEl.textContent = comments.length > 0 ? formatDateTime(comments[0].created_at).split(',')[0] : '-';
      }

      function renderFeed(items) {
        if (!items || items.length === 0) {
          feedContainer.innerHTML = `
            <div style="padding: 48px 24px; text-align: center; border: var(--hairline); background: var(--surface); color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
              [BELUM ADA KOMENTAR PADA TUGAS INI]
            </div>
          `;
          return;
        }

        feedContainer.innerHTML = items
          .map((comment) => {
            const task = taskMap.get(comment.assignment_id);
            const taskTitle = task ? task.title : 'Dokumen Tugas Terkait';
            const meetPad = task ? String(task.meeting).padStart(2, '0') : '--';
            const isApproved = comment.is_approved === true;

            return `
              <article class="comment-card" style="margin-bottom: var(--space-4);">
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; border-bottom: var(--hairline); padding-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="type-micro" style="color: var(--accent); font-weight: 700;">TUGAS-${meetPad}</span>
                    <a href="detail.html?id=${encodeURIComponent(comment.assignment_id)}" target="_blank" class="font-heading" style="font-size: var(--text-small); font-weight: 600; color: var(--text-primary); text-decoration: underline;" title="Buka Detail Tugas">
                      ${escapeHTML(taskTitle)}
                    </a>
                    <span class="badge-status ${isApproved ? 'published' : 'draft'}" style="margin-left: 8px;">
                      <span class="badge-dot"></span>
                      ${isApproved ? 'Disetujui' : 'Menunggu Moderasi'}
                    </span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro);">${formatDateTime(comment.created_at)}</span>
                    <button type="button" onclick="window.toggleApproveComment('${escapeHTML(comment.id)}', ${isApproved})" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;">
                      ${isApproved ? 'Tangguhkan' : 'Setujui'}
                    </button>
                    <button type="button" onclick="window.deleteCommentPrompt('${escapeHTML(comment.id)}')" class="btn btn-danger btn-sm" style="padding: 2px 8px; font-size: 11px;">
                      Hapus
                    </button>
                  </div>
                </div>

                <div style="margin-bottom: 6px;">
                  <span class="comment-author" style="font-size: var(--text-small);">${escapeHTML(comment.author_name)}</span>
                  <span class="type-micro" style="color: var(--accent); margin-left: 6px;">[${escapeHTML(comment.role_label || 'Dosen')}]</span>
                </div>

                <p class="type-body" style="font-size: var(--text-small); color: var(--text-primary); line-height: var(--leading-normal);">
                  ${escapeHTML(comment.content)}
                </p>
              </article>
            `;
          })
          .join('');
      }

      if (filterSelect) {
        filterSelect.addEventListener('change', function () {
          const val = filterSelect.value;
          if (val === 'all') {
            renderFeed(comments);
          } else {
            renderFeed(comments.filter((c) => c.assignment_id === val));
          }
        });
      }

      renderFeed(comments);
    } catch (err) {
      console.error('Error in initReviewPage:', err);
    }

    window.toggleApproveComment = async function (commentId, currentApproved) {
      try {
        const { error } = await client
          .from('comments')
          .update({ is_approved: !currentApproved })
          .eq('id', commentId);

        if (error) {
          alert('Gagal memoderasi komentar: ' + error.message);
          return;
        }
        initReviewPage();
      } catch (err) {
        alert('Terjadi kesalahan koneksi.');
      }
    };

    window.deleteCommentPrompt = async function (commentId) {
      const confirmed = window.confirm('Hapus komentar ini dari arsip?');
      if (!confirmed) return;

      try {
        const { error } = await client.from('comments').delete().eq('id', commentId);
        if (error) {
          alert('Gagal menghapus komentar: ' + error.message);
          return;
        }
        initReviewPage();
      } catch (err) {
        alert('Terjadi kesalahan koneksi saat menghapus.');
      }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReviewPage();
  });
})();
