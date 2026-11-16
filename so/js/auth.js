/**
 * AUTHENTICATION & ROUTE GUARD CONTROLLER (SUPABASE MAGIC LINK & OTP)
 * Swiss Editorial System - Academic Archive (2026)
 * Endru Aidil Fitriansyah (NIM 2503010054)
 */

(function () {
  'use strict';

  // Email administrator resmi
  const ADMIN_EMAIL = 'endruaidil.fitriansyah@gmail.com';

  window.ArchiveAuth = {
    ADMIN_EMAIL: ADMIN_EMAIL,

    // Mengambil user session aktif dari Supabase
    async getSession() {
      if (!window.SupabaseArchive || !window.SupabaseArchive.client) {
        return null;
      }
      try {
        const { data, error } = await window.SupabaseArchive.client.auth.getSession();
        if (error || !data || !data.session) return null;
        return data.session;
      } catch (err) {
        console.error('Error getSession:', err);
        return null;
      }
    },

    // Mengambil profil user saat ini
    async getUser() {
      const session = await this.getSession();
      return session ? session.user : null;
    },

    // Mengecek apakah user aktif adalah administrator
    async isAdmin() {
      const session = await this.getSession();
      if (!session || !session.user) return false;

      // 1. Verifikasi email secara case-insensitive
      const userEmail = (session.user.email || '').toLowerCase().trim();
      if (userEmail !== this.ADMIN_EMAIL.toLowerCase().trim()) {
        return false;
      }

      // 2. Verifikasi status role di tabel profiles jika tersedia
      try {
        const { data, error } = await window.SupabaseArchive.client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !data) {
          // Jika data profil belum tersinkronisasi, izinkan berdasarkan kecocokan email admin
          return true;
        }
        return data.role === 'admin';
      } catch (err) {
        console.warn('Verifikasi profil fallback ke email:', err);
        return true;
      }
    },

    // Mengirim Magic Link / Kode OTP ke email admin (tanpa password)
    async sendMagicLink(email = this.ADMIN_EMAIL) {
      if (!window.SupabaseArchive || !window.SupabaseArchive.client) {
        return { success: false, message: 'Koneksi Supabase belum siap.' };
      }

      try {
        const redirectUrl = new URL('manage.html', window.location.href).href;

        const { data, error } = await window.SupabaseArchive.client.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          return { success: false, message: error.message };
        }

        return { success: true, data: data };
      } catch (err) {
        console.error('Error in sendMagicLink:', err);
        return { success: false, message: 'Terjadi kesalahan sistem saat mengirim tautan masuk.' };
      }
    },

    // Memverifikasi kode OTP 6 digit dari email
    async verifyOtp(token, email = this.ADMIN_EMAIL) {
      if (!window.SupabaseArchive || !window.SupabaseArchive.client) {
        return { success: false, message: 'Koneksi Supabase belum siap.' };
      }

      try {
        const { data, error } = await window.SupabaseArchive.client.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          type: 'email'
        });

        if (error) {
          return { success: false, message: error.message };
        }

        if (!data || !data.session) {
          return { success: false, message: 'Sesi tidak dapat dibuat dari kode ini.' };
        }

        return { success: true, session: data.session };
      } catch (err) {
        console.error('Error in verifyOtp:', err);
        return { success: false, message: 'Kode verifikasi tidak valid atau telah kedaluwarsa.' };
      }
    },

    // Keluar dari sesi dan kembali ke halaman kelola (manage.html)
    async logout(reason) {
      if (window.SupabaseArchive && window.SupabaseArchive.client) {
        try {
          await window.SupabaseArchive.client.auth.signOut();
        } catch (err) {
          console.warn('Error saat signOut:', err);
        }
      }

      let redirectTarget = 'manage.html';
      if (reason === 'unauthorized') {
        redirectTarget += '?error=unauthorized';
      }
      window.location.replace(redirectTarget);
    },

    // Penjaga halaman admin: verifikasi sesi aktif sebelum menampilkan konten
    async requireAuth() {
      const session = await this.getSession();
      if (!session || !session.user) {
        const currentPage = window.location.pathname.split('/').pop() || 'admin.html';
        window.location.replace('manage.html?redirect=' + encodeURIComponent(currentPage));
        return false;
      }

      const isValidAdmin = await this.isAdmin();
      if (!isValidAdmin) {
        console.warn('Percobaan akses tidak sah oleh:', session.user.email);
        alert('Akses ditolak: Akun ' + (session.user.email || 'ini') + ' bukan akun administrator resmi.');
        await this.logout('unauthorized');
        return false;
      }

      return true;
    }
  };
})();
