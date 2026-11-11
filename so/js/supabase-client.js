/**
 * SUPABASE CLIENT INITIALIZATION & CONFIGURATION
 * Academic Archive - Sistem Operasi (2026)
 * Endru Aidil Fitriansyah (NIM 2503010054)
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://wmxpbquvfpprksusxayf.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_toPnGkKSnPVElcN-nAyOFg_fo673KTE';

  if (!window.supabase) {
    console.error('Library Supabase JS belum dimuat. Pastikan CDN Supabase telah disertakan.');
    return;
  }

  // Inisialisasi klien Supabase
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Ekspos ke global window
  window.SupabaseArchive = {
    client: client,
    url: SUPABASE_URL,

    // Helper untuk membuat Signed URL berkas lampiran privat (default durasi 300 detik / 5 menit)
    async createSignedUrl(filePath, expiresIn = 300) {
      if (!filePath) return null;
      try {
        const { data, error } = await client.storage
          .from('assignment-attachments')
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          console.error('Gagal membuat signed URL:', error.message);
          return null;
        }
        return data.signedUrl;
      } catch (err) {
        console.error('Error createSignedUrl:', err);
        return null;
      }
    }
  };
})();
