/**
 * ADMIN CONTROLLER - SWISS EDITORIAL (SUPABASE CONNECTED)
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

  function formatDate(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  }

  // ==========================================================================
  // HALAMAN: ADMIN DASHBOARD
  // ==========================================================================
  async function initAdminDashboard() {
    const tableBody = document.getElementById('admin-table-body');
    const statTotalEl = document.getElementById('admin-stat-total');
    const statPubEl = document.getElementById('admin-stat-published');
    const statDraftEl = document.getElementById('admin-stat-draft');
    const statCommentsEl = document.getElementById('admin-stat-comments');

    if (!tableBody) return;

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    if (!client) return;

    // Loading State
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
          [MEMUAT DATA ARSIP ADMINISTRATOR DARI SUPABASE...]
        </td>
      </tr>
    `;

    try {
      // Ambil seluruh tugas (draft + published)
      const { data: assignments, error: aErr } = await client
        .from('assignments')
        .select('*, assignment_files(count)')
        .order('meeting', { ascending: true });

      if (aErr) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 32px; text-align: center; color: var(--accent); font-family: var(--font-mono); font-size: var(--text-small);">
              [GAGAL MEMUAT ARSIP: ${escapeHTML(aErr.message)}]
            </td>
          </tr>
        `;
        return;
      }

      // Ambil jumlah seluruh komentar
      const { count: commentCount, error: cErr } = await client
        .from('comments')
        .select('*', { count: 'exact', head: true });

      const items = assignments || [];
      const totalCount = items.length;
      const publishedCount = items.filter((a) => a.status === 'published').length;
      const draftCount = items.filter((a) => a.status === 'draft').length;

      if (statTotalEl) statTotalEl.textContent = totalCount;
      if (statPubEl) statPubEl.textContent = publishedCount;
      if (statDraftEl) statDraftEl.textContent = draftCount;
      if (statCommentsEl) statCommentsEl.textContent = commentCount || 0;

      if (items.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-small);">
              [BELUM ADA TUGAS TERSIMPAN DALAM ARSIP]
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = items
        .map((item, index) => {
          const serial = String(index + 1).padStart(2, '0');
          const isPublished = item.status === 'published';
          const meetPad = String(item.meeting).padStart(2, '0');
          const fileCount = item.assignment_files && item.assignment_files[0] ? item.assignment_files[0].count : 0;
          const dateStr = formatDate(item.due_date || item.created_at);

          const statusLabel = (item.category || '').toLowerCase() === 'belum selesai' ? 'Belum Selesai' : 'Selesai';
          return `
            <tr style="border-bottom: var(--hairline); transition: background-color var(--transition-fast);">
              <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-small); color: var(--accent); font-weight: 600;">
                ${serial}
              </td>
              <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-micro); text-transform: uppercase; color: var(--text-secondary);">
                TUGAS-${meetPad}
              </td>
              <td style="padding: 12px 16px;">
                <a href="detail.html?id=${encodeURIComponent(item.id)}" target="_blank" style="font-family: var(--font-heading); font-weight: 600; font-size: var(--text-small); color: var(--text-primary); display: block;" title="Buka Pratinjau Publik">
                  ${escapeHTML(item.title)}
                </a>
                <span style="font-family: var(--font-mono); font-size: var(--text-micro); color: var(--text-muted);">${statusLabel} &bull; ${dateStr}</span>
              </td>
              <td style="padding: 12px 16px;">
                <span class="badge-status ${escapeHTML(item.status)}">
                  <span class="badge-dot"></span>
                  ${statusLabel}
                </span>
              </td>
              <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-small); color: var(--text-secondary);">
                ${fileCount} berkas
              </td>
              <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                <div style="display: inline-flex; align-items: center; gap: 8px;">
                  <button type="button" onclick="window.togglePublishStatus('${escapeHTML(item.id)}', '${item.status}')" class="btn btn-secondary btn-sm" title="${isPublished ? 'Jadikan Privat' : 'Jadikan Publik'}">
                    ${isPublished ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                  <a href="editor.html?id=${encodeURIComponent(item.id)}" class="btn btn-secondary btn-sm" title="Edit Tugas">
                    Edit
                  </a>
                  <button type="button" onclick="window.deleteAssignmentPrompt('${escapeHTML(item.id)}', '${escapeHTML(item.title)}')" class="btn btn-danger btn-sm" title="Hapus Tugas">
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      console.error('Error initAdminDashboard:', err);
    }

    window.togglePublishStatus = async function (id, currentStatus) {
      const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
      try {
        const { error } = await client
          .from('assignments')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          alert('Gagal mengubah status tugas: ' + error.message);
          return;
        }
        initAdminDashboard();
      } catch (err) {
        alert('Terjadi kesalahan koneksi.');
      }
    };

    window.deleteAssignmentPrompt = async function (id, title) {
      const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus arsip "${title}"? Seluruh berkas dan komentar terkait akan terhapus.`);
      if (!confirmed) return;

      try {
        const { error } = await client.from('assignments').delete().eq('id', id);
        if (error) {
          alert('Gagal menghapus tugas: ' + error.message);
          return;
        }
        initAdminDashboard();
      } catch (err) {
        alert('Terjadi kesalahan koneksi saat menghapus.');
      }
    };
  }

  // ==========================================================================
  // HALAMAN: ASSIGNMENT EDITOR (CREATE / EDIT TUGAS + UPLOAD BERKAS)
  // ==========================================================================
  async function initAssignmentEditor() {
    const form = document.getElementById('assignment-form');
    if (!form) return;

    const client = window.SupabaseArchive ? window.SupabaseArchive.client : null;
    if (!client) return;

    const params = new URLSearchParams(window.location.search);
    const existingId = params.get('id');

    const formTitleEl = document.getElementById('editor-page-title');
    const titleInput = document.getElementById('field-title');
    const meetingInput = document.getElementById('field-meeting');
    const categoryInput = document.getElementById('field-category');
    const dateInput = document.getElementById('field-date');
    const statusInput = document.getElementById('field-status');
    const descInput = document.getElementById('field-desc');
    const objectivesInput = document.getElementById('field-objectives');
    const discussionInput = document.getElementById('field-discussion');
    const resultInput = document.getElementById('field-result');

    const dropzone = document.getElementById('editor-dropzone');
    const fileInput = document.getElementById('file-input');
    const stagedFilesList = document.getElementById('staged-files-list');

    // Berkas yang sudah ada di Supabase
    let existingFiles = [];
    // Berkas baru yang di-drop/pilih pengguna (File objects)
    let newFilesQueue = [];

    // Jika mengedit tugas yang ada
    if (existingId) {
      try {
        const { data: item, error } = await client
          .from('assignments')
          .select('*, assignment_files(*)')
          .eq('id', existingId)
          .single();

        if (!error && item) {
          const meetPad = String(item.meeting).padStart(2, '0');
          if (formTitleEl) formTitleEl.textContent = `Edit Tugas ${meetPad}`;
          document.title = `Edit ${item.title}: Academic Archive`;

          titleInput.value = item.title || '';
          meetingInput.value = item.meeting || 1;
          categoryInput.value = item.category || 'Selesai';
          dateInput.value = item.due_date ? item.due_date.split('T')[0] : '';
          statusInput.value = item.status || 'draft';
          descInput.value = item.description || '';
          objectivesInput.value = (item.objectives || []).join('\n');
          discussionInput.value = item.discussion || '';
          resultInput.value = item.result_summary || '';

          existingFiles = item.assignment_files || [];
          renderAllFiles();
        }
      } catch (err) {
        console.error('Error pre-populating editor:', err);
      }
    }

    function renderAllFiles() {
      if (!stagedFilesList) return;
      if (existingFiles.length === 0 && newFilesQueue.length === 0) {
        stagedFilesList.innerHTML = `<span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro);">Belum ada berkas dilampirkan.</span>`;
        return;
      }

      let html = '';

      // Tampilkan berkas yang sudah tersimpan di database
      existingFiles.forEach((file, index) => {
        const fSize = (file.file_size / (1024 * 1024)).toFixed(2) + ' MB';
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: var(--hairline); background: var(--surface); border-radius: var(--radius-sm); margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
              <span class="type-micro" style="color: var(--accent); font-weight: 700;">TERSIMPAN</span>
              <span class="font-heading" style="font-size: var(--text-small); color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHTML(file.file_name)}</span>
              <span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro); white-space: nowrap;">(${fSize})</span>
            </div>
            <button type="button" onclick="window.deleteExistingFile('${escapeHTML(file.id)}', '${escapeHTML(file.file_path)}')" class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 10px;">
              Hapus
            </button>
          </div>
        `;
      });

      // Tampilkan berkas baru yang siap diunggah saat simpan
      newFilesQueue.forEach((file, index) => {
        const fSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px dashed var(--accent); background: var(--surface); border-radius: var(--radius-sm); margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
              <span class="type-micro" style="color: var(--accent); font-weight: 700;">BARU</span>
              <span class="font-heading" style="font-size: var(--text-small); color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHTML(file.name)}</span>
              <span class="type-meta" style="color: var(--text-muted); font-size: var(--text-micro); white-space: nowrap;">(${fSize})</span>
            </div>
            <button type="button" onclick="window.removeQueuedFile(${index})" class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 10px;">
              Batal
            </button>
          </div>
        `;
      });

      stagedFilesList.innerHTML = html;
    }

    window.removeQueuedFile = function (index) {
      newFilesQueue.splice(index, 1);
      renderAllFiles();
    };

    window.deleteExistingFile = async function (fileId, filePath) {
      const confirmed = window.confirm('Hapus berkas ini dari penyimpanan arsip?');
      if (!confirmed) return;

      try {
        // Hapus dari Supabase Storage
        if (filePath) {
          await client.storage.from('assignment-attachments').remove([filePath]);
        }
        // Hapus record dari database
        await client.from('assignment_files').delete().eq('id', fileId);

        existingFiles = existingFiles.filter((f) => f.id !== fileId);
        renderAllFiles();
      } catch (err) {
        alert('Gagal menghapus berkas: ' + err.message);
      }
    };

    // Drag & Drop listener
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
      });

      fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
      });
    }

    function handleFiles(files) {
      if (!files || files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        newFilesQueue.push(files[i]);
      }
      renderAllFiles();
    }

    // Submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan Tugas...';
      }

      const title = titleInput.value.trim();
      const meetingNum = parseInt(meetingInput.value, 10) || 1;
      const category = categoryInput.value;
      const dateVal = dateInput.value || new Date().toISOString().split('T')[0];
      const status = statusInput.value;
      const desc = descInput.value.trim();
      const rawObjectives = objectivesInput.value.trim();
      const discussion = discussionInput.value.trim();
      const result = resultInput.value.trim();

      if (!title || !desc) {
        alert('Mohon isi judul dan ringkasan tugas.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Simpan Arsip Tugas';
        }
        return;
      }

      const objectivesArray = rawObjectives
        ? rawObjectives.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
        : [];

      const meetPad = String(meetingNum).padStart(2, '0');
      const codeVal = `SO-${meetPad}`;

      try {
        let currentAssignmentId = existingId;

        const payload = {
          meeting: meetingNum,
          code: codeVal,
          title: title,
          category: category,
          description: desc,
          objectives: objectivesArray,
          discussion: discussion,
          result_summary: result,
          due_date: dateVal,
          status: status,
          updated_at: new Date().toISOString()
        };

        if (existingId) {
          // Update tugas
          const { error: updateErr } = await client
            .from('assignments')
            .update(payload)
            .eq('id', existingId);

          if (updateErr) throw updateErr;
        } else {
          // Insert tugas baru
          const { data: newRow, error: insertErr } = await client
            .from('assignments')
            .insert([payload])
            .select()
            .single();

          if (insertErr) throw insertErr;
          currentAssignmentId = newRow.id;
        }

        // Unggah berkas antrean baru ke Supabase Storage & Catat ke assignment_files
        if (newFilesQueue.length > 0 && currentAssignmentId) {
          for (const file of newFilesQueue) {
            const fileExt = file.name.split('.').pop();
            const cleanBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const storagePath = `assignments/${currentAssignmentId}/${Date.now()}_${cleanBase}`;

            const { error: uploadErr } = await client.storage
              .from('assignment-attachments')
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadErr) {
              console.error('Gagal mengunggah file:', uploadErr.message);
              continue;
            }

            // Catat metadata berkas ke tabel assignment_files
            await client.from('assignment_files').insert([
              {
                assignment_id: currentAssignmentId,
                file_name: file.name,
                file_path: storagePath,
                file_size: file.size,
                mime_type: file.type || 'application/octet-stream'
              }
            ]);
          }
        }

        alert('Tugas dan lampiran berhasil disimpan.');
        window.location.href = 'admin.html';
      } catch (err) {
        alert('Terjadi kesalahan: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Simpan Arsip Tugas';
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
    initAssignmentEditor();
  });
})();
