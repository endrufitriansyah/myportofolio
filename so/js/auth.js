/**
 * AUTHENTICATION & ROUTE GUARD CONTROLLER (SUPABASE AUTH)
 * Swiss Editorial System - Academic Archive (2026)
 * Endru Aidil Fitriansyah (NIM 2503010054)
 */

(function () {
  'use strict';

  window.ArchiveAuth = {
    // Mengecek apakah ada user session aktif di Supabase
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

    // Mengecek apakah user yang login memiliki role 'admin' di tabel profiles
    async isAdmin() {
      const session = await this.getSession();
      if (!session || !session.user) return false;

      try {
        const { data, error } = await window.SupabaseArchive.client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !data) return false;
        return data.role === 'admin';
      } catch (err) {
        console.error('Error checking admin role:', err);
        return false;
      }
    },

    // Melakukan login dengan email & password
    async login(email, password) {
      if (!window.SupabaseArchive || !window.SupabaseArchive.client) {
        return { success: false, message: 'Koneksi Supabase belum siap.' };
      }

      try {
        const { data, error } = await window.SupabaseArchive.client.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          return { success: false, message: error.message };
        }

        if (!data || !data.user) {
          return { success: false, message: 'Pengguna tidak ditemukan.' };
        }

        // Verifikasi apakah akun adalah admin
        const hasAdminRole = await this.isAdmin();
        if (!hasAdminRole) {
          await this.logout();
          return {
            success: false,
            message: 'Akses ditolak: Akun Anda tidak memiliki hak administrator.'
          };
        }

        return { success: true, user: data.user };
      } catch (err) {
        return { success: false, message: 'Terjadi kesalahan sistem saat autentikasi.' };
      }
    },

    // Logout dan redirect ke login
    async logout() {
      if (window.SupabaseArchive && window.SupabaseArchive.client) {
        await window.SupabaseArchive.client.auth.signOut();
      }
      window.location.replace('login.html');
    },

    // Penjaga halaman admin: redirect ke login jika tidak terautentikasi
    async requireAuth() {
      const session = await this.getSession();
      if (!session) {
        const currentPage = window.location.pathname.split('/').pop() || 'admin.html';
        window.location.replace('login.html?redirect=' + encodeURIComponent(currentPage));
        return false;
      }

      const hasAdminRole = await this.isAdmin();
      if (!hasAdminRole) {
        alert('Akses ditolak: Anda tidak memiliki wewenang administrator.');
        await this.logout();
        return false;
      }

      return true;
    }
  };
})();
