/**
 * PUBLIC ARCHIVE INTERACTION CONTROLLER (SUPABASE CONNECTED)
 * Swiss Editorial System - Sistem Operasi
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

  function formatDate(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
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

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ==========================================================================
  // HALAMAN 1: INDEX (DAFTAR TUGAS PUBLIK)
  // ==========================================================================
  async function initIndexPage() {
    const listContainer = document.getElementById('archive-list');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('meeting-filter');
    const totalCountEl = document.getElementById('stat-total');
    const publishedCountEl = document.getElementById('stat-published');
    const meetingsCountEl = document.getElementById('stat-meetings');

    if (!listContainer) return;

    // Loading State
    listContainer.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
        [MEMUAT ARSIP DARI SUPABASE...]
      </div>
    `;

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    let assignments = [];

    if (client) {
      try {
        const { data, error } = await client
          .from('assignments')
          .select('*')
          .eq('status', 'published')
          .order('meeting', { ascending: true });

        if (error) {
          console.error('Gagal mengambil tugas dari Supabase:', error.message);
          listContainer.innerHTML = `
            <div style="padding: 48px 24px; text-align: center; color: var(--accent); font-family: var(--font-mono); font-size: var(--text-small);">
              [GAGAL MEMUAT ARSIP: ${escapeHTML(error.message)}]
            </div>
          `;
          return;
        }

        assignments = data || [];
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    } else {
      // Fallback lokal jika klien Supabase belum aktif
      if (window.ArchiveStore) {
        assignments = window.ArchiveStore.getAssignments().filter((a) => a.status === 'published');
      }
    }

    // Perbarui Statistik
    if (totalCountEl) totalCountEl.textContent = assignments.length;
    if (publishedCountEl) {
      const completedCount = assignments.filter((a) => (a.category || '').toLowerCase() === 'selesai' || a.status === 'published').length;
      publishedCountEl.textContent = completedCount;
    }
    if (meetingsCountEl) {
      const distinctMeetings = new Set(assignments.map((a) => a.meeting));
      meetingsCountEl.textContent = distinctMeetings.size;
    }

    // Perbarui Dropdown Filter Pilihan Tugas Secara Dinamis dari Data Riil
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="all">Semua Tugas</option>` +
        assignments
          .map((item) => {
            const num = String(item.meeting).padStart(2, '0');
            return `<option value="${item.meeting}">Tugas ${num}: ${escapeHTML(item.title)}</option>`;
          })
          .join('');
    }

    function renderList(items) {
      if (!items || items.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
            [Tugas tidak ditemukan]
          </div>
        `;
        return;
      }

      listContainer.innerHTML = items
        .map((item, idx) => {
          const serial = String(idx + 1).padStart(2, '0');
          const meetPad = String(item.meeting).padStart(2, '0');
          const meetLabel = `TUGAS-${meetPad}`;
          const dateStr = formatDate(item.due_date || item.created_at);

          const statusLabel = (item.category || '').toLowerCase() === 'belum selesai' ? 'Belum Selesai' : 'Selesai';

          // Bersihkan tag HTML dari pratinjau teks di daftar arsip
          const cleanDesc = (item.description || '')
            .replace(/<table[\s\S]*?<\/table>/gi, '[Tabel Data]')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const shortDesc = cleanDesc.length > 150 ? cleanDesc.slice(0, 150) + '...' : cleanDesc;

          return `
            <article class="archive-row" onclick="window.location.href='detail.html?id=${encodeURIComponent(item.id)}'" role="link" tabindex="0" onkeydown="if(event.key==='Enter') window.location.href='detail.html?id=${encodeURIComponent(item.id)}'">
              <span class="row-num">${serial}</span>
              <span class="row-meet">${meetLabel}</span>
              <div class="row-title">
                ${escapeHTML(item.title)}
                <small>${escapeHTML(shortDesc)}</small>
              </div>
              <span class="row-date">${dateStr}</span>
              <div class="row-status">
                <span class="badge-status ${escapeHTML(item.status)}">
                  <span class="badge-dot"></span>
                  ${statusLabel}
                </span>
              </div>
              <div class="row-action" title="Buka Detail Tugas">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </article>
          `;
        })
        .join('');
    }

    function applyFilters() {
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const meetingVal = filterSelect ? filterSelect.value : 'all';

      const filtered = assignments.filter((item) => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const codeMatch = (item.code || '').toLowerCase().includes(query);
        const searchOk = titleMatch || descMatch || codeMatch;

        let meetingOk = true;
        if (meetingVal !== 'all') {
          meetingOk = String(item.meeting) === String(meetingVal);
        }

        return searchOk && meetingOk;
      });

      renderList(filtered);
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
    if (filterSelect) {
      filterSelect.addEventListener('change', applyFilters);
    }

    // Tampilkan daftar awal
    renderList(assignments);
  }

  // ==========================================================================
  // HALAMAN 2: DETAIL TUGAS PUBLIK (DETAIL.HTML)
  // ==========================================================================
  async function initDetailPage() {
    const detailContainer = document.getElementById('assignment-detail-view');
    if (!detailContainer) return;

    const params = new URLSearchParams(window.location.search);
    const assignmentId = params.get('id');

    if (!assignmentId) {
      detailContainer.innerHTML = `
        <div style="padding: 48px 24px; text-align: center; border: var(--hairline); background: var(--surface);">
          <span class="type-micro" style="color: var(--accent); display: block; margin-bottom: 8px;">KESALAHAN NAVIGASI</span>
          <h2 class="type-h2" style="margin-bottom: 16px;">Tugas Tidak Ditemukan</h2>
          <p class="type-body" style="color: var(--text-secondary); margin-bottom: 24px;">Parameter pengenal tugas tidak disertakan dalam tautan.</p>
          <a href="index.html" class="btn btn-primary btn-sm">&larr; Kembali ke Daftar Arsip</a>
        </div>
      `;
      return;
    }

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    let item = null;
    let allPublished = [];

    if (client) {
      try {
        // Ambil data tugas
        const { data: assignmentData, error: assignmentError } = await client
          .from('assignments')
          .select('*')
          .eq('id', assignmentId)
          .eq('status', 'published')
          .single();

        if (assignmentError || !assignmentData) {
          detailContainer.innerHTML = `
            <div style="padding: 48px 24px; text-align: center; border: var(--hairline); background: var(--surface);">
              <span class="type-micro" style="color: var(--accent); display: block; margin-bottom: 8px;">TUGAS TIDAK TERSEDIA</span>
              <h2 class="type-h2" style="margin-bottom: 16px;">Tugas Belum Tersedia atau Dihapus</h2>
              <p class="type-body" style="color: var(--text-secondary); margin-bottom: 24px;">Tugas ini masih berstatus privat atau belum dapat diakses.</p>
              <a href="index.html" class="btn btn-primary btn-sm">&larr; Kembali ke Daftar Arsip</a>
            </div>
          `;
          return;
        }

        item = assignmentData;

        // Ambil daftar file lampiran dari tabel assignment_files
        const { data: filesData } = await client
          .from('assignment_files')
          .select('*')
          .eq('assignment_id', assignmentId);

        item.files = filesData || [];

        // Ambil seluruh tugas published untuk navigasi Prev/Next
        const { data: navData } = await client
          .from('assignments')
          .select('id, meeting, title')
          .eq('status', 'published')
          .order('meeting', { ascending: true });

        allPublished = navData || [];
      } catch (err) {
        console.error('Error fetching detail from Supabase:', err);
      }
    } else if (window.ArchiveStore) {
      // Fallback mock
      item = window.ArchiveStore.getAssignmentById(assignmentId);
      allPublished = window.ArchiveStore.getAssignments().filter((a) => a.status === 'published');
    }

    if (!item) return;

    // Render Data Header
    const meetPad = String(item.meeting).padStart(2, '0');
    const meetLabel = `Tugas ${meetPad}`;

    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = item.title;

    const codeEl = document.getElementById('detail-code');
    if (codeEl) codeEl.textContent = item.code || `SO-${meetPad}`;

    const titleEl = document.getElementById('detail-title');
    if (titleEl) titleEl.textContent = item.title;

    const meetEl = document.getElementById('detail-meeting');
    if (meetEl) meetEl.textContent = meetLabel;

    const statusEl = document.getElementById('detail-status');
    if (statusEl) {
      const isDone = (item.category || '').toLowerCase() !== 'belum selesai';
      const statusLabel = isDone ? 'Selesai' : 'Belum Selesai';
      statusEl.className = 'badge-status ' + (isDone ? 'published' : 'draft');
      statusEl.innerHTML = `<span class="badge-dot"></span>${statusLabel}`;
    }

    const catEl = document.getElementById('detail-category');
    if (catEl) catEl.textContent = (item.category || '').toLowerCase() === 'belum selesai' ? 'Belum Selesai' : 'Selesai';

    const dateEl = document.getElementById('detail-date');
    if (dateEl) dateEl.textContent = formatDate(item.due_date || item.created_at);

    // Soal Tugas (Mendukung Teks Biasa & Tabel HTML)
    const descEl = document.getElementById('detail-desc');
    if (descEl) {
      const desc = item.description || '-';
      if (desc.includes('<table') || desc.includes('<div') || desc.includes('<p') || desc.includes('<ul') || desc.includes('<ol')) {
        descEl.innerHTML = desc;
      } else {
        descEl.innerHTML = desc
          .split('\n\n')
          .map((p) => `<p style="margin-bottom: 12px; line-height: var(--leading-relaxed);">${escapeHTML(p).replace(/\n/g, '<br>')}</p>`)
          .join('');
      }
    }

    // Tujuan Pembelajaran
    const objectivesEl = document.getElementById('detail-objectives');
    if (objectivesEl) {
      const objs = Array.isArray(item.objectives) ? item.objectives : [];
      if (objs.length === 0) {
        objectivesEl.innerHTML = `<li class="type-meta" style="color: var(--text-muted);">-</li>`;
      } else {
        objectivesEl.innerHTML = objs
          .map(
            (obj, i) =>
              `<li><span class="type-meta" style="color: var(--accent); margin-right: 8px;">[0${i + 1}]</span>${escapeHTML(obj)}</li>`
          )
          .join('');
      }
    }

    // Pembahasan Teknis (Mendukung HTML & Tabel Langsung)
    const discussionEl = document.getElementById('detail-discussion');
    if (discussionEl) {
      const disc = item.discussion || '';
      // Jika berisi tag HTML (seperti <table>, <svg>, <div class="table-wrap">), render langsung
      if (disc.includes('<table') || disc.includes('<div') || disc.includes('<p') || disc.includes('<svg')) {
        discussionEl.innerHTML = disc;
      } else {
        discussionEl.innerHTML = disc
          .split('\n\n')
          .map((p) => `<p style="margin-bottom: 16px; line-height: var(--leading-relaxed);">${escapeHTML(p).replace(/\n/g, '<br>')}</p>`)
          .join('');
      }
    }

    // Kesimpulan / Hasil
    const resultEl = document.getElementById('detail-result');
    if (resultEl) resultEl.textContent = item.result_summary || item.resultSummary || '-';

    // Pisahkan Berkas: Gambar (PNG, JPG, JPEG) vs Dokumen Unduhan (PDF, dsb)
    const files = item.files || [];
    const imageFiles = files.filter((f) => {
      const mime = (f.mime_type || '').toLowerCase();
      const name = (f.file_name || f.name || '').toLowerCase();
      return (
        mime.startsWith('image/') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp')
      );
    });
    const docFiles = files.filter((f) => !imageFiles.includes(f));

    // Render Gambar / Diagram Visual Langsung di Postingan Web
    const imagesSec = document.getElementById('detail-images-section');
    const imagesContainer = document.getElementById('detail-images-container');
    if (imagesSec && imagesContainer) {
      if (imageFiles.length > 0) {
        imagesSec.style.display = 'block';
        imagesContainer.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
            [MEMUAT GAMBAR LAMPIRAN...]
          </div>
        `;

        // Ambil Signed URL untuk setiap gambar
        Promise.all(
          imageFiles.map(async (img) => {
            const fPath = img.file_path || img.url || '';
            const fName = img.file_name || img.name || 'Diagram Tabel';
            let src = fPath;
            if (window.SupabaseArchive && fPath) {
              const signed = await window.SupabaseArchive.createSignedUrl(fPath, 600);
              if (signed) src = signed;
            }
            return { name: fName, src: src };
          })
        ).then((loadedImages) => {
          imagesContainer.innerHTML = loadedImages
            .map(
              (img) => `
            <figure style="margin: 0; background: var(--surface); border: var(--hairline); border-radius: var(--radius-sm); overflow: hidden;">
              <div style="padding: 10px 16px; border-bottom: var(--hairline); background: var(--surface-muted); display: flex; align-items: center; justify-content: space-between;">
                <span class="type-micro" style="color: var(--accent); font-weight: bold;">LAMPIRAN VISUAL</span>
                <span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro);">${escapeHTML(img.name)}</span>
              </div>
              <div style="padding: 16px; text-align: center; background: #FFFFFF;">
                <img src="${img.src}" alt="${escapeHTML(img.name)}" style="max-width: 100%; height: auto; display: inline-block; border-radius: var(--radius-sm); box-shadow: 0 1px 3px rgba(0,0,0,0.05);" loading="lazy">
              </div>
            </figure>
          `
            )
            .join('');
        });
      } else {
        imagesSec.style.display = 'none';
      }
    }

    // Lampiran Dokumen Lainnya (PDF/Word/PPT)
    const filesEl = document.getElementById('detail-files');
    if (filesEl) {
      if (docFiles.length === 0) {
        filesEl.innerHTML = `<span class="type-meta" style="color: var(--text-muted); display: block; margin-top: 12px;">Tidak ada dokumen unduhan tambahan pada tugas ini.</span>`;
      } else {
        filesEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
            ${docFiles
              .map((f, idx) => {
                const fName = f.file_name || f.name || 'Dokumen Lampiran';
                const fSize = f.file_size ? formatFileSize(f.file_size) : (f.size || '-');
                const fPath = f.file_path || f.url || '';
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: var(--hairline); background: var(--surface); border-radius: var(--radius-sm);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span class="type-meta" style="color: var(--accent); font-weight: bold;">DOC</span>
                      <div>
                        <strong class="font-heading" style="font-size: var(--text-small); display: block;">${escapeHTML(fName)}</strong>
                        <span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro);">${fSize}</span>
                      </div>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.downloadAttachment('${escapeHTML(fPath)}', '${escapeHTML(fName)}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Unduh Berkas
                    </button>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
    }

    // Navigasi Prev / Next
    const currentIndex = allPublished.findIndex((a) => a.id === item.id);
    const prevItem = currentIndex > 0 ? allPublished[currentIndex - 1] : null;
    const nextItem = currentIndex < allPublished.length - 1 ? allPublished[currentIndex + 1] : null;

    const navPrevEl = document.getElementById('nav-prev');
    const navNextEl = document.getElementById('nav-next');

    if (navPrevEl) {
      if (prevItem) {
        navPrevEl.href = `detail.html?id=${encodeURIComponent(prevItem.id)}`;
        navPrevEl.querySelector('.nav-label').textContent = `Tugas ${String(prevItem.meeting).padStart(2, '0')}`;
        navPrevEl.querySelector('.nav-title').textContent = prevItem.title;
        navPrevEl.style.visibility = 'visible';
      } else {
        navPrevEl.style.visibility = 'hidden';
      }
    }

    if (navNextEl) {
      if (nextItem) {
        navNextEl.href = `detail.html?id=${encodeURIComponent(nextItem.id)}`;
        navNextEl.querySelector('.nav-label').textContent = `Tugas ${String(nextItem.meeting).padStart(2, '0')}`;
        navNextEl.querySelector('.nav-title').textContent = nextItem.title;
        navNextEl.style.visibility = 'visible';
      } else {
        navNextEl.style.visibility = 'hidden';
      }
    }

    // Komentar dan Form
    await renderComments(item.id);
    bindCommentForm(item.id);
  }

  // ==========================================================================
  // FITUR KOMENTAR PUBLIK (SUPABASE RLS COMPLIANT)
  // ==========================================================================
  async function renderComments(assignmentId) {
    const commentListEl = document.getElementById('comment-list');
    const commentCountEl = document.getElementById('comment-count');
    if (!commentListEl) return;

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    let comments = [];

    if (client) {
      try {
        const { data, error } = await client
          .from('comments')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          comments = data;
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    } else if (window.ArchiveStore) {
      comments = window.ArchiveStore.getComments(assignmentId);
    }

    if (commentCountEl) commentCountEl.textContent = comments.length;

    if (comments.length === 0) {
      commentListEl.innerHTML = `
        <div style="padding: 24px; border: var(--hairline); text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small); background: var(--surface);">
          Belum ada komentar untuk tugas ini.
        </div>
      `;
      return;
    }

    commentListEl.innerHTML = comments
      .map(
        (c) => `
        <div class="comment-card">
          <div class="comment-header">
            <span class="comment-author">${escapeHTML(c.author_name || c.author)} <small style="color: var(--accent); font-weight: normal;">[${escapeHTML(c.role_label || c.role || 'Dosen')}]</small></span>
            <span class="comment-time">${formatDateTime(c.created_at || c.dateFormatted)}</span>
          </div>
          <p class="type-body" style="font-size: var(--text-small); color: var(--text-primary); line-height: var(--leading-relaxed);">${escapeHTML(c.content)}</p>
        </div>
      `
      )
      .join('');
  }

  function bindCommentForm(assignmentId) {
    const form = document.getElementById('comment-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const authorInput = document.getElementById('comment-author');
      const contentInput = document.getElementById('comment-content');
      const submitBtn = form.querySelector('button[type="submit"]');

      const author = authorInput.value.trim();
      const content = contentInput.value.trim();

      if (!author || !content) {
        alert('Mohon lengkapi nama dan isi catatan komentar.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
      }

      const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;

      if (client) {
        try {
          const { error } = await client.from('comments').insert([
            {
              assignment_id: assignmentId,
              author_name: author,
              role_label: 'Dosen',
              content: content,
              is_approved: false // Wajib false sesuai RLS Policy
            }
          ]);

          if (error) {
            alert('Gagal mengirim komentar: ' + error.message);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Kirim Komentar';
            }
            return;
          }

          contentInput.value = '';
          const notice = document.getElementById('comment-feedback');
          if (notice) {
            notice.textContent = 'Komentar berhasil dikirim dan menunggu persetujuan admin.';
            notice.style.display = 'block';
            setTimeout(() => {
              notice.style.display = 'none';
            }, 6000);
          }
        } catch (err) {
          alert('Terjadi kesalahan koneksi saat mengirim komentar.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Komentar';
          }
        }
      } else {
        // Fallback local store
        const now = new Date();
        const newComment = {
          id: 'c-' + Date.now(),
          assignmentId: assignmentId,
          author: author,
          role: 'Dosen',
          dateFormatted: formatDateTime(now),
          content: content
        };
        if (window.ArchiveStore) {
          window.ArchiveStore.addComment(newComment);
        }
        contentInput.value = '';
        renderComments(assignmentId);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kirim Komentar';
        }
      }
    });
  }

  // Global helper untuk download via Signed URL temporer
  window.downloadAttachment = async function (filePath, fileName) {
    if (!filePath) {
      alert('Path berkas tidak valid.');
      return;
    }

    if (window.SupabaseArchive) {
      const signedUrl = await window.SupabaseArchive.createSignedUrl(filePath, 300);
      if (signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = fileName || 'dokumen-laporan.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }

    alert('Tidak dapat membuat signed URL. Berkas mungkin belum diunggah atau sesi unduh kedaluwarsa.');
  };

  document.addEventListener('DOMContentLoaded', () => {
    initIndexPage();
    initDetailPage();
  });
})();
