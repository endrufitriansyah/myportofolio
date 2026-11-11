/**
 * STORE & MOCK DATA - SWISS EDITORIAL ARCHIVE
 * Academic Archive - Sistem Operasi (2026)
 * Mahasiswa: Endru Aidil Fitriansyah (NIM 2503010054)
 */

(function () {
  const STORAGE_KEY = 'academic_archive_assignments_v1';
  const COMMENTS_KEY = 'academic_archive_comments_v1';

  const DEFAULT_ASSIGNMENTS = [
    {
      id: 'tugas-01-disk',
      meeting: 1,
      meetingLabel: 'Pertemuan 01',
      code: 'SO-01',
      title: 'Algoritma Penjadwalan Disk (Disk Scheduling)',
      description: 'Analisis pergerakan head dan perhitungan total lintasan pada hard disk 200 track menggunakan algoritma FCFS, SSTF, SCAN, C-SCAN, LOOK, dan C-LOOK.',
      date: '2026-11-23',
      dateFormatted: '23 Nov 2026',
      status: 'published',
      category: 'Selesai',
      objectives: [
        'Memahami arsitektur fisik hard disk drive dan mekanisme pergerakan head pada silinder.',
        'Mengimplementasikan perhitungan seek time dan jarak lintasan untuk 6 algoritma penjadwalan.',
        'Mengevaluasi efisiensi arah pergerakan head terhadap antrian permintaan I/O blok.'
      ],
      discussion: `Sebuah hard disk memiliki 200 track bernomor 0 hingga 199. Posisi head awal berada pada track 50. Antrian permintaan akses track yang masuk secara berurutan adalah:
62, 170, 43, 150, 23, 16, 185, 123, 67, 43, 162, 23, 71, 111, 43, 178.

Dalam pengujian ini dilakukan perhitungan matematis terhadap jarak mutlak yang ditempuh:
1. FCFS (First-Come, First-Served): Melayani permintaan persis sesuai urutan datang. Menghasilkan total 1.348 lintasan karena terjadi lonjakan bolak-balik antara track rendah dan tinggi.
2. SSTF (Shortest Seek Time First): Memilih track dengan jarak terdekat dari posisi head aktif. Total lintasan turun drastis menjadi 318 lintasan.
3. SCAN (Elevator Algorithm): Bergerak menuju ujung disk (track 199) melayani permintaan searah, kemudian berbalik arah. Total lintasan adalah 332 track.
4. LOOK: Varian SCAN yang hanya bergerak sampai permintaan tertinggi (track 185) tanpa menyentuh ujung fisik 199. Menjadi algoritma paling efisien dengan 304 track.`,
      resultSummary: 'Algoritma LOOK terbukti menghasilkan jarak lintasan terpendek (304 track), diikuti oleh SSTF (318 track). FCFS menghasilkan overhead tertinggi (1.348 track) akibat variasi posisi request yang tersebar acak.',
      files: [
        { name: 'Laporan_Tugas_01_Disk_Scheduling.pdf', size: '1.4 MB', type: 'application/pdf', url: '#' },
        { name: 'Dataset_Simulasi_Track.xlsx', size: '42 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#' }
      ]
    },
    {
      id: 'tugas-02-cpu',
      meeting: 2,
      meetingLabel: 'Pertemuan 02',
      code: 'SO-02',
      title: 'Algoritma Penjadwalan CPU (CPU Scheduling)',
      description: 'Studi komparasi Turnaround Time (TR) dan Waiting Time (WT) untuk proses A, B, C, D, dan E dengan metode FCFS, SJF, SRT, HPRN, dan Round Robin.',
      date: '2026-11-30',
      dateFormatted: '30 Nov 2026',
      status: 'published',
      category: 'Selesai',
      objectives: [
        'Menganalisis perbedaan mekanisme Preemptive dan Non-Preemptive pada CPU multiprogramming.',
        'Menyusun Gantt Chart penjadwalan proses berdasarkan Saat Tiba dan Lama Proses.',
        'Menghitung nilai rata-rata Waktu Tunggu (WT) dan Waktu Tanggap (TR) untuk menentukan performa algoritma optimal.'
      ],
      discussion: `Diberikan parameter 5 proses independen:
- Proses A: Tiba = 0, Durasi = 8
- Proses B: Tiba = 3, Durasi = 4
- Proses C: Tiba = 5, Durasi = 7
- Proses D: Tiba = 8, Durasi = 6
- Proses E: Tiba = 12, Durasi = 5

Hasil evaluasi Gantt Chart menunjukkan:
1. SRT (Shortest Remaining Time / Preemptive) memberikan rata-rata waktu tanggap paling optimal yaitu TR rata-rata 11,6 ms dan WT rata-rata 5,6 ms.
2. SJF Non-Preemptive menghasilkan rata-rata TR 12,4 ms dan WT 6,4 ms.
3. Round Robin dengan kuantum 3 menghasilkan overhead konteks lebih tinggi dengan rata-rata TR 17,8 ms karena frekuensi pergantian proses yang rapat.`,
      resultSummary: 'Algoritma preemptive SRT (Shortest Remaining Time) menghasilkan efisiensi tertinggi bagi antrian proses campuran, sementara Round Robin lebih adil bagi sistem interaktif multi-user.',
      files: [
        { name: 'Dokumen_Kalkulasi_Gantt_Chart.pdf', size: '2.1 MB', type: 'application/pdf', url: '#' }
      ]
    },
    {
      id: 'tugas-03-memori',
      meeting: 3,
      meetingLabel: 'Pertemuan 03',
      code: 'SO-03',
      title: 'Manajemen Memori & Simulasi Page Replacement',
      description: 'Implementasi dan perbandingan page fault rate pada algoritma FIFO, Least Recently Used (LRU), dan Optimal Replacement.',
      date: '2026-12-07',
      dateFormatted: '07 Des 2026',
      status: 'published',
      category: 'Selesai',
      objectives: [
        'Memahami konsep Virtual Memory, paging, frame alokasi, dan penanganan page fault.',
        'Mengukur anomali Belady pada algoritma FIFO.',
        'Membandingkan performa LRU menggunakan stack dan time-stamp register.'
      ],
      discussion: `Simulasi dilakukan dengan string referensi halaman: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1 dengan alokasi 3 frame memori fisik.
Pengujian menunjukkan algoritma LRU menghasilkan 12 page fault, sementara FIFO menghasilkan 15 page fault pada urutan pengujian yang sama.`,
      resultSummary: 'LRU mendekati batas teoritis algoritma Optimal tanpa memerlukan pengetahuan masa depan mengenai referensi halaman berikutnya.',
      files: [
        { name: 'Laporan_Virtual_Memory_LRU_FIFO.pdf', size: '980 KB', type: 'application/pdf', url: '#' }
      ]
    },
    {
      id: 'tugas-04-deadlock',
      meeting: 4,
      meetingLabel: 'Pertemuan 04',
      code: 'SO-04',
      title: 'Pencegahan Deadlock dengan Algoritma Banker',
      description: 'Simulasi alokasi sumber daya berganda (multiple resource allocation) dan verifikasi Safe State pada sistem operasi.',
      date: '2026-12-14',
      dateFormatted: '14 Des 2026',
      status: 'draft',
      category: 'Selesai',
      objectives: [
        'Mengidentifikasi 4 kondisi mutual exclusion, hold and wait, no preemption, dan circular wait.',
        'Menerapkan matriks Allocation, Max, Need, dan Available pada algoritma Banker.'
      ],
      discussion: 'Draf persiapan analisis matriks alokasi untuk 5 proses dan 3 tipe resource (A, B, C).',
      resultSummary: 'Dokumentasi masih dalam proses finalisasi draf pengerjaan.',
      files: []
    }
  ];

  const DEFAULT_COMMENTS = [
    {
      id: 'c-01',
      assignmentId: 'tugas-01-disk',
      author: 'Dosen Pengampu',
      role: 'Reviewer',
      date: '2026-11-24',
      dateFormatted: '24 Nov 2026, 09:15 WIB',
      content: 'Perhitungan jarak lintasan untuk LOOK dan C-LOOK sudah sangat akurat. Penjelasan perbandingan selisih seek time antara FCFS dan SSTF dituliskan dengan argumentasi teknis yang jelas. Lanjutkan ke tugas penjadwalan CPU.'
    },
    {
      id: 'c-02',
      assignmentId: 'tugas-02-cpu',
      author: 'Asisten Dosen',
      role: 'Reviewer',
      date: '2026-12-01',
      dateFormatted: '01 Des 2026, 14:30 WIB',
      content: 'Gantt Chart pada SRT (Preemptive) sudah sesuai dengan saat tiba proses C dan D. Nilai rata-rata Turnaround Time 11,6 ms terverifikasi valid.'
    }
  ];

  window.ArchiveStore = {
    getAssignments: function () {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ASSIGNMENTS));
        return DEFAULT_ASSIGNMENTS;
      }
      try {
        return JSON.parse(stored);
      } catch (e) {
        return DEFAULT_ASSIGNMENTS;
      }
    },

    getAssignmentById: function (id) {
      const all = this.getAssignments();
      return all.find((item) => item.id === id) || null;
    },

    saveAssignment: function (item) {
      const all = this.getAssignments();
      const index = all.findIndex((a) => a.id === item.id);
      if (index >= 0) {
        all[index] = { ...all[index], ...item };
      } else {
        all.unshift(item);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return item;
    },

    deleteAssignment: function (id) {
      let all = this.getAssignments();
      all = all.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    },

    getComments: function (assignmentId) {
      const stored = localStorage.getItem(COMMENTS_KEY);
      const list = stored ? JSON.parse(stored) : DEFAULT_COMMENTS;
      if (!assignmentId) return list;
      return list.filter((c) => c.assignmentId === assignmentId);
    },

    addComment: function (comment) {
      const stored = localStorage.getItem(COMMENTS_KEY);
      const list = stored ? JSON.parse(stored) : DEFAULT_COMMENTS;
      list.unshift(comment);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
      return comment;
    }
  };
})();
