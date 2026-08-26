export const INDONESIAN_MALE_NAMES = [
  'Ahmad', 'Aditya', 'Agus', 'Andi', 'Arief', 'Bambang', 'Budi', 'Bayu', 'Chandra', 'Dedy',
  'Dewo', 'Dimas', 'Dwi', 'Eko', 'Fajar', 'Farhan', 'Gilang', 'Hendra', 'Heri', 'Irfan',
  'Joko', 'Kevin', 'Lukman', 'Muhammad', 'Mulyono', 'Nugroho', 'Prabowo', 'Putra', 'Rian', 'Rizky',
  'Rudy', 'Santoso', 'Setiawan', 'Taufik', 'Tri', 'Utomo', 'Wahyu', 'Wibowo', 'Yudi', 'Yusuf'
];

export const INDONESIAN_FEMALE_NAMES = [
  'Amanda', 'Anggraini', 'Ani', 'Anisa', 'Ayu', 'Citra', 'Dewi', 'Dian', 'Eka', 'Elvira',
  'Fitri', 'Gita', 'Indah', 'Intan', 'Kartika', 'Lestari', 'Maria', 'Mega', 'Melati', 'Nabila',
  'Niken', 'Novita', 'Putri', 'Ratna', 'Rina', 'Rini', 'Sari', 'Siti', 'Sri', 'Suci',
  'Tari', 'Utami', 'Wati', 'Wulan', 'Yanti', 'Yuliana', 'Yuni', 'Zahra', 'Kusuma', 'Syafira'
];

export const INDONESIAN_SURNAMES = [
  'Wijaya', 'Saputra', 'Kusuma', 'Siregar', 'Nasution', 'Ginting', 'Hidayat', 'Kurniawan',
  'Pratama', 'Nugroho', 'Wibowo', 'Prasetyo', 'Gunawan', 'Budiman', 'Halim', 'Tan', 'Lubis',
  'Simanjuntak', 'Situmorang', 'Pohan', 'Subagyo', 'Suryono', 'Hartono', 'Purnama', 'Wahyudi',
  'Sutrisno', 'Hadi', 'Nugraha', 'Pramono', 'Wardhana', 'Saraswati', 'Larasati', 'Puspita',
  'Anggoro', 'Dharmawan', 'Basuki', 'Sudarsono', 'Pangestu', 'Tanjung', 'Salim'
];

export const INDONESIAN_STREETS = [
  'Jl. Jenderal Sudirman', 'Jl. M.H. Thamrin', 'Jl. Gatot Subroto', 'Jl. Rasuna Said',
  'Jl. Gajah Mada', 'Jl. Hayam Wuruk', 'Jl. Pemuda', 'Jl. Merdeka', 'Jl. Diponegoro',
  'Jl. Ahmad Yani', 'Jl. Asia Afrika', 'Jl. Dago', 'Jl. Malioboro', 'Jl. Kaliurang',
  'Jl. Margonda Raya', 'Jl. Pajajaran', 'Jl. Slamet Riyadi', 'Jl. Basuki Rahmat',
  'Jl. HR. Muhammad', 'Jl. Sunset Road', 'Jl. Raya Uluwatu', 'Jl. Kebon Jeruk',
  'Jl. Mawar', 'Jl. Melati', 'Jl. Anggrek', 'Jl. Kamboja', 'Jl. Dahlia', 'Jl. Cempaka',
  'Jl. Flamboyan', 'Jl. Bougenville', 'Jl. Kenanga', 'Jl. Tanjung', 'Jl. Beringin'
];

export const INDONESIAN_CITIES = [
  { city: 'Jakarta Selatan', prov: 'DKI Jakarta', code: '3174' },
  { city: 'Jakarta Pusat', prov: 'DKI Jakarta', code: '3171' },
  { city: 'Jakarta Barat', prov: 'DKI Jakarta', code: '3173' },
  { city: 'Jakarta Timur', prov: 'DKI Jakarta', code: '3175' },
  { city: 'Jakarta Utara', prov: 'DKI Jakarta', code: '3172' },
  { city: 'Bandung', prov: 'Jawa Barat', code: '3273' },
  { city: 'Bogor', prov: 'Jawa Barat', code: '3271' },
  { city: 'Depok', prov: 'Jawa Barat', code: '3276' },
  { city: 'Bekasi', prov: 'Jawa Barat', code: '3275' },
  { city: 'Tangerang Selatan', prov: 'Banten', code: '3674' },
  { city: 'Tangerang', prov: 'Banten', code: '3671' },
  { city: 'Serang', prov: 'Banten', code: '3673' },
  { city: 'Semarang', prov: 'Jawa Tengah', code: '3374' },
  { city: 'Surakarta (Solo)', prov: 'Jawa Tengah', code: '3372' },
  { city: 'Yogyakarta', prov: 'DI Yogyakarta', code: '3471' },
  { city: 'Surabaya', prov: 'Jawa Timur', code: '3578' },
  { city: 'Malang', prov: 'Jawa Timur', code: '3573' },
  { city: 'Denpasar', prov: 'Bali', code: '5171' }
];

export const JOBS_BY_SECTOR: Record<string, string[]> = {
  tech: [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer',
    'Data Scientist', 'DevOps Specialist', 'IT Support', 'Product Manager',
    'QA Engineer', 'Mobile Developer', 'Cyber Security Analyst', 'System Administrator'
  ],
  health: [
    'Dokter Umum', 'Dokter Gigi', 'Dokter Spesialis', 'Perawat',
    'Apoteker', 'Bidan', 'Analis Kesehatan', 'Fisioterapis'
  ],
  edu: [
    'Guru SD', 'Guru SMP', 'Guru SMA', 'Dosen Universitas',
    'Tutor Bimbel', 'Konselor Pendidikan', 'Pustakawan'
  ],
  finance: [
    'Akuntan', 'Financial Analyst', 'Auditor', 'Teller Bank',
    'Customer Service Bank', 'Tax Consultant', 'Broker Saham', 'Kredit Analis'
  ],
  gov: [
    'Staf Administrasi PNS', 'Analis Kebijakan Publik', 'Petugas Pajak',
    'Diplomat', 'Lurah', 'Staf Kementrian'
  ],
  other: [
    'Wiraswasta', 'Karyawan Swasta', 'Mahasiswa', 'Ibu Rumah Tangga',
    'Arsitek', 'Desainer Grafis', 'Fotografer', 'Jurnalis',
    'Chef / Koki', 'Barista', 'Marketing Executive', 'Content Creator'
  ]
};

export const HOBBIES = [
  'Membaca Buku', 'Menulis Blog', 'Bersepeda', 'Bermain Game',
  'Menonton Film', 'Memasak', 'Fotografi', 'Melukis',
  'Bermain Alat Musik', 'Berenang', 'Traveling', 'Berkebun',
  'Olahraga / Gym', 'Mendaki Gunung', 'Memancing', 'Merajut'
];

export const RELIGIONS = [
  { name: 'Islam', weight: 87.0 },
  { name: 'Kristen Protestan', weight: 7.0 },
  { name: 'Katolik', weight: 3.0 },
  { name: 'Hindu', weight: 1.7 },
  { name: 'Buddha', weight: 0.8 },
  { name: 'Konghucu', weight: 0.5 }
];

export const EDUCATION_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];
export const PHONE_PREFIXES: Record<string, string[]> = {
  tsel: ['0811', '0812', '0813', '0821', '0822', '0852'],
  isat: ['0815', '0816', '0856', '0857', '0858'],
  xl: ['0817', '0818', '0819', '0877', '0878'],
  sf: ['0881', '0882', '0887', '0888']
};
