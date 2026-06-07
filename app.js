console.log("app.js loaded successfully");
// ============================================================
// Yoklama Sistemi - Personel Devam Takip (Cevrimdisi Destekli)
// ============================================================

// ============================================================
// GUVENLIK: Global hata yakalayici + splash yedek
// ============================================================
window.addEventListener('error', (e) => {
  console.error('Global hata:', e.error || e.message);
  hideSplashForced();
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Yakalanmamis hata:', e.reason);
  hideSplashForced();
});

// Splash'i en fazla 6 saniye sonra gizle - hicbir zaman takilmasin
let splashForceHidden = false;
function hideSplashForced() {
  if (splashForceHidden) return;
  splashForceHidden = true;
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 500);
  }
  // Uygulama baslatilmadiysa giris ekranini goster
  setTimeout(() => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    if (loginScreen && mainApp && mainApp.classList.contains('hidden') && loginScreen.classList.contains('hidden')) {
      loginScreen.classList.remove('hidden');
      showLogin();
    }
  }, 600);
}
setTimeout(hideSplashForced, 6000);

// ============================================================
// FIREBASE IMPORTLARI (yedekli)
// ============================================================
let firebaseApp, auth, db, provider;
let firebaseReady = false;
let XLSX = null;

// Hata yonetimi ile modul importlari
async function initModules() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, GoogleAuthProvider, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onSnapshot, writeBatch, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    const firebaseConfig = {
      apiKey: "AIzaSyDjEZsPpbHq7r50pe400NUo7cvZANYeSac",
      authDomain: "deimrpilek.firebaseapp.com",
      projectId: "deimrpilek",
      storageBucket: "deimrpilek.firebasestorage.app",
      messagingSenderId: "716821036614",
      appId: "1:716821036614:web:779ff5cb9209c10379d447",
      measurementId: "G-XCHPH116GP"
    };

    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    provider = new GoogleAuthProvider();
    firebaseReady = true;

    // Firebase fonksiyonlarini global kapsama ekle
    window._fb = { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onSnapshot, writeBatch, where, signOut };

    // XLSX kutuphanesini yuklemeyi dene
    try {
      const xlsxMod = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      XLSX = xlsxMod;
    } catch (xlsxErr) {
      console.warn('XLSX kutuphanesi yuklenemedi:', xlsxErr);
    }

    return true;
  } catch (e) {
    console.error('Firebase baslatilamadi:', e);
    firebaseReady = false;
    return false;
  }
}

// ============================================================
// DOM ONBELLEK
// ============================================================
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

const DOM = {
  splash: $('splash'), loginScreen: $('loginScreen'), mainApp: $('mainApp'),
  pageTitle: $('pageTitle'), pageSubtitle: $('pageSubtitle'),
  userAvatar: $('userAvatar'),
  drawer: $('drawer'), drawerOverlay: $('drawerOverlay'),
  drawerAvatar: $('drawerAvatar'), drawerUserName: $('drawerUserName'),
  drawerUserEmail: $('drawerUserEmail'), offlineBadge: $('offlineBadge'),
  pageContent: $('pageContent'), toast: $('toast'),
  globalSearch: $('globalSearch'), searchResults: $('searchResults'),
  todayDay: $('todayDay'), todayDate: $('todayDate'), todayServiceBadge: $('todayServiceBadge'),
  statTotal: $('statTotal'), statPresentToday: $('statPresentToday'),
  statAbsentToday: $('statAbsentToday'),
  topAttendees: $('topAttendees'), needsFollowup: $('needsFollowup'),
  attendanceDate: $('attendanceDate'), attendanceList: $('attendanceList'),
  attendanceSearch: $('attendanceSearch'),
  presentCount: $('presentCount'), absentCount: $('absentCount'), totalCount: $('totalCount'),
  selectAllPresent: $('selectAllPresent'), selectAllAbsent: $('selectAllAbsent'),
  attToggleHint: $('attToggleHint'), quickActions: $('quickActions'),
  girlsList: $('girlsList'), addGirlBtn: $('addGirlBtn'),
  calendarGrid: $('calendarGrid'), calMonthYear: $('calMonthYear'),
  dayDetail: $('dayDetail'), calPrev: $('calPrev'), calNext: $('calNext'),
  statsMonth: $('statsMonth'), bigStatsGrid: $('bigStatsGrid'),
  absenceChart: $('absenceChart'), attendanceRanking: $('attendanceRanking'),
  timeFilterTabs: $('timeFilterTabs'),
  historyList: $('historyList'), historyFilter: $('historyFilter'),
  clearHistoryBtn: $('clearHistoryBtn'), loadMoreHistory: $('loadMoreHistory'),
  loadMoreHistoryBtn: $('loadMoreHistoryBtn'), exportMonth: $('exportMonth'),
  exportCSV: $('exportCSV'), exportJSON: $('exportJSON'), exportPrint: $('exportPrint'),
  girlModal: $('girlModal'), girlModalTitle: $('girlModalTitle'),
  girlName: $('girlName'), girlPhone: $('girlPhone'), girlGrade: $('girlGrade'),
  girlNotes: $('girlNotes'), deleteGirlBtn: $('deleteGirlBtn'),
  closeGirlModal: $('closeGirlModal'), cancelGirlModal: $('cancelGirlModal'),
  saveGirlBtn: $('saveGirlBtn'), girlProfileModal: $('girlProfileModal'),
  profileName: $('profileName'), profileBody: $('profileBody'),
  closeProfileModal: $('closeProfileModal'), attendanceModal: $('attendanceModal'),
  attendanceModalTitle: $('attendanceModalTitle'), modalGirlName: $('modalGirlName'),
  attendanceNotes: $('attendanceNotes'), ratingSection: $('ratingSection'),
  starsInput: $('starsInput'), saveAttendanceEntry: $('saveAttendanceEntry'),
  closeAttendanceModal: $('closeAttendanceModal'), cancelAttendanceModal: $('cancelAttendanceModal'),
  confirmOverlay: $('confirmOverlay'), confirmIcon: $('confirmIcon'),
  confirmTitle: $('confirmTitle'), confirmMsg: $('confirmMsg'),
  confirmCancel: $('confirmCancel'), confirmOk: $('confirmOk'),
  activityDetailModal: $('activityDetailModal'),
  activityDetailTitle: $('activityDetailTitle'),
  closeActivityDetailModal: $('closeActivityDetailModal'),
  activityDetailSummary: $('activityDetailSummary'),
  activityDetailIcon: $('activityDetailIcon'),
  activityDetailName: $('activityDetailName'),
  activityDetailPeriod: $('activityDetailPeriod'),
  activityDetailTotal: $('activityDetailTotal'),
  activityDetailTabs: $('activityDetailTabs'),
  activityDetailList: $('activityDetailList'),
  presentTabCount: $('presentTabCount'),
  absentTabCount: $('absentTabCount'),
  menuBtn: $('menuBtn'), signOutBtn: $('signOutBtn'), googleSignIn: $('googleSignIn'),
  darkModeToggle: $('darkModeToggle'), darkToggleSwitch: $('darkToggleSwitch'),
  shareProfileBtn: $('shareProfileBtn'), editProfileBtn: $('editProfileBtn')
};

// ============================================================
// CEVRIMDISI SENKRON KUYRUK
// ============================================================
const OfflineQueue = {
  queue: [],
  isSyncing: false,
  lastOnline: true,

  async init() {
    try {
      const saved = await IDB.getAll('pendingSync');
      this.queue = saved || [];
    } catch (e) { console.warn('OfflineQueue baslatma hatasi:', e); }
  },

  async add(operation) {
    const op = {
      id: 'op_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type: operation.type,
      data: operation.data,
      timestamp: Date.now(),
      retries: 0
    };
    this.queue.push(op);
    try { await IDB.add('pendingSync', op); } catch (e) {}
    showToast('Yerel olarak kaydedildi - internet dondugunde senkronize edilecek', 'warning');
    this.trySync();
  },

  async remove(opId) {
    this.queue = this.queue.filter(o => o.id !== opId);
    try { await IDB.delete('pendingSync', opId); } catch (e) {}
  },

  async trySync() {
    if (this.isSyncing || !navigator.onLine || !firebaseReady || !window._fb) return;
    if (this.queue.length === 0) return;

    this.isSyncing = true;
    const toSync = [...this.queue];

    for (const op of toSync) {
      try {
        switch (op.type) {
          case 'saveGirl': {
            const { doc, setDoc } = window._fb;
            await setDoc(doc(db, 'girls', op.data.id), op.data);
            break;
          }
          case 'saveAttendance': {
            const { doc, setDoc } = window._fb;
            await setDoc(doc(db, 'attendance', op.data.id), op.data);
            break;
          }
          case 'saveBatchAttendance': {
            const { writeBatch, doc } = window._fb;
            const batch = writeBatch(db);
            op.data.records.forEach(rec => {
              batch.set(doc(db, 'attendance', rec.id), rec);
            });
            await batch.commit();
            break;
          }
          case 'deleteGirl': {
            const { doc, setDoc } = window._fb;
            await setDoc(doc(db, 'girls', op.data.id), op.data, { merge: true });
            break;
          }
          case 'deleteAttendance': {
            const { doc, deleteDoc } = window._fb;
            await deleteDoc(doc(db, 'attendance', op.data.key));
            break;
          }
          case 'saveHistory': {
            const { doc, setDoc } = window._fb;
            await setDoc(doc(db, 'history', op.data.id), op.data);
            break;
          }
        }
        await this.remove(op.id);
      } catch (e) {
        console.error('Senkronizasyon hatasi:', op.type, e);
        op.retries++;
        if (op.retries >= 5) {
          await this.remove(op.id);
        } else {
          try { await IDB.add('pendingSync', op); } catch (e2) {}
        }
      }
    }

    this.isSyncing = false;
    if (this.queue.length > 0) {
      setTimeout(() => this.trySync(), 30000);
    } else {
      showToast('Tum veriler bulut ile senkronize edildi', 'success');
    }
  }
};

// ============================================================
// CEVRIMICI / CEVRIMDISI YONETIMI
// ============================================================
function updateOnlineStatus() {
  const isOnline = navigator.onLine;

  const headerBadge = document.getElementById('offlineBadgeHeader');
  if (headerBadge) {
    headerBadge.classList.toggle('hidden', isOnline);
  }

  const drawerBadge = document.getElementById('offlineBadge');
  if (drawerBadge) {
    drawerBadge.style.display = isOnline ? 'none' : 'block';
  }

  if (isOnline && !OfflineQueue.lastOnline) {
    showToast('Baglanti geri geldi - senkronize ediliyor...', 'success');
    OfflineQueue.trySync();
  } else if (!isOnline && OfflineQueue.lastOnline) {
    showToast('Baglanti kesildi - islemler yerel olarak kaydedilecek', 'warning');
  }

  OfflineQueue.lastOnline = isOnline;
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============================================================
// UYGULAMA DURUMU
// ============================================================
const state = {
  currentUser: null,
  girls: [],
  attendanceData: {},
  currentPage: 'home',
  selectedDay: getCurrentServiceDay() || 'Cumartesi',
  selectedActivity: 'Genel',
  currentAttendanceGirlId: null,
  currentAttendanceRating: 0,
  editingGirlId: null,
  calendarDate: new Date(),
  appInitialized: false,
  renderTimeout: null,
  historyOffset: 0,
  historyAllLogs: [],
  deleteInProgress: false,
  homeGradeFilter: '',
  girlsGradeFilter: '',
  girlsSearchQuery: '',
  statsTimeFilter: 'today',
  statsGradeFilter: '',
  longPressTimer: null,
  isLongPress: false,
  currentProfileGirlId: null,
  searchDebounceTimer: null,
  attSearchDebounceTimer: null,
  attendancePageInitialized: false,
  savingGirl: false,
  currentActivityDetail: null,
  activityDetailTab: 'present',
  idb: false
};

const HISTORY_PAGE_SIZE = 30;
// Calisma gunleri: Cumartesi'den Persembe'ye (6 gun). Cuma tatil.
const SERVICE_DAYS = { 'Cumartesi': true, 'Pazar': true, 'Pazartesi': true, 'Sali': true, 'Carsamba': true, 'Persembe': true };
const SERVICE_DAY_NUMBERS = [0, 1, 2, 3, 4, 6];
const DAY_NAMES = ['Pazar','Pazartesi','Sali','Carsamba','Persembe','Cuma','Cumartesi'];

// JS gun numarasini (0=Pazar..6=Cumartesi) Turkce calisma gunu adina esle
const JS_DAY_TO_TURKISH = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Sali',
  3: 'Carsamba',
  4: 'Persembe',
  6: 'Cumartesi'
};
const ACTIVITIES = ['Genel'];
const ACTIVITY_ICONS = { 'Genel': '&#128204;' };
const PERIOD_LABELS = { today: 'Bugun', month: 'Bu Ay', year: 'Bu Yil', all: 'Tum Donemler' };

// ============================================================
// XSS KORUMA
// ============================================================
const esc = (() => {
  const div = document.createElement('div');
  const txt = document.createTextNode('');
  div.appendChild(txt);
  return (str) => {
    txt.nodeValue = String(str ?? '');
    return div.innerHTML;
  };
})();

function xmlEsc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================
// TARIH YARDIMCILARI
// ============================================================
const DateUtil = {
  pad: (n) => String(n).padStart(2, '0'),
  toStr(d = new Date()) {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },
  getMonthStr(d = new Date()) {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}`;
  },
  formatMonth(str) {
    if (!str) return '';
    const [y, m] = str.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
  },
  formatDateShort(d = new Date()) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  },
  dayName(d = new Date()) { return DAY_NAMES[d.getDay()]; },
  normalize(d) {
    return { 'Pazar': 'Pazar', 'Pazartesi': 'Pazartesi', 'Sali': 'Sali', 'Carsamba': 'Carsamba', 'Persembe': 'Persembe', 'Cuma': 'Cuma', 'Cumartesi': 'Cumartesi' }[d] || d;
  }
};

function getServiceDaysInMonth(year, month) {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay();
    if (SERVICE_DAY_NUMBERS.includes(dayOfWeek)) {
      days.push(`${year}-${DateUtil.pad(month + 1)}-${DateUtil.pad(d)}`);
    }
  }
  return days;
}

function getServiceDaysUpToDate(fromYear, fromMonth, toDate) {
  let count = 0;
  const to = new Date(toDate + 'T00:00:00');
  const daysInMonth = new Date(fromYear, fromMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${fromYear}-${DateUtil.pad(fromMonth + 1)}-${DateUtil.pad(d)}`;
    const current = new Date(dateStr + 'T00:00:00');
    if (current > to) break;
    const dayOfWeek = current.getDay();
    if (SERVICE_DAY_NUMBERS.includes(dayOfWeek)) {
      count++;
    }
  }
  return count;
}

function hasConsecutiveAbsences(girlId, monthStr) {
  const absRecords = Object.values(state.attendanceData)
    .filter(a => a.girlId === girlId && a.date?.startsWith(monthStr) && a.status === 'Yok');

  if (absRecords.length < 2) return { hasConsecutive: false, count: absRecords.length, dates: [] };

  const absDates = [...new Set(absRecords.map(a => a.date))].sort();

  for (let i = 0; i < absDates.length - 1; i++) {
    const d1 = new Date(absDates[i] + 'T00:00:00');
    const d2 = new Date(absDates[i + 1] + 'T00:00:00');
    const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24);
    if (diffDays <= 3) {
      return { hasConsecutive: true, count: absDates.length, dates: absDates };
    }
  }
  return { hasConsecutive: false, count: absDates.length, dates: absDates };
}

// ============================================================
// BIRLESIK ISTATISTIK SINIRLARI
// ============================================================
function getStatsBounds() {
  const selectedDate = DOM.statsMonth && DOM.statsMonth.value ? DOM.statsMonth.value : DateUtil.toStr();

  switch (state.statsTimeFilter) {
    case 'today':
      return { start: selectedDate, end: selectedDate };
    case 'month':
      return { start: selectedDate.substring(0, 7) + '-01', end: selectedDate };
    case 'year':
      return { start: selectedDate.substring(0, 4) + '-01-01', end: selectedDate };
    default:
      return { start: '2000-01-01', end: selectedDate };
  }
}

function getPeriodBounds(period, customDate) {
  const selectedDate = customDate || DateUtil.toStr();
  switch (period) {
    case 'today':
      return { start: selectedDate, end: selectedDate };
    case 'month':
      return { start: selectedDate.substring(0, 7) + '-01', end: selectedDate };
    case 'year':
      return { start: selectedDate.substring(0, 4) + '-01-01', end: selectedDate };
    default:
      return { start: '2000-01-01', end: selectedDate };
  }
}

// ============================================================
// METIN NORMALIZASYONU (Turkce icin)
// ============================================================
function normalizeTurkish(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o');
}

function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function csvEscape(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

// ============================================================
// INDEXEDDB - cevrimdisi gecmis depolama
// ============================================================
const IDB = {
  db: null,
  DB_NAME: 'girlsTrackerDB',
  DB_VERSION: 1,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' });
        }
      };
    });
  },

  async add(storeName, data) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// ============================================================
// KOYU MOD
// ============================================================
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (DOM.darkToggleSwitch) DOM.darkToggleSwitch.classList.add('on');
  }
}

if (DOM.darkModeToggle) {
  DOM.darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      if (DOM.darkToggleSwitch) DOM.darkToggleSwitch.classList.remove('on');
      localStorage.setItem('darkMode', 'false');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (DOM.darkToggleSwitch) DOM.darkToggleSwitch.classList.add('on');
      localStorage.setItem('darkMode', 'true');
    }
  });
}

// ============================================================
// TOAST (Bildirim)
// ============================================================
let toastTimeout;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimeout);
  if (!DOM.toast) return;
  DOM.toast.textContent = msg;
  DOM.toast.className = `toast show ${type}`;
  toastTimeout = setTimeout(() => { if (DOM.toast) DOM.toast.className = 'toast hidden'; }, 3000);
}

// ============================================================
// SPLASH
// ============================================================
let splashDone = false;
function hideSplash() {
  if (splashDone) return;
  splashDone = true;
  splashForceHidden = true;
  if (DOM.splash) {
    DOM.splash.classList.add('fade-out');
    setTimeout(() => { if (DOM.splash) DOM.splash.remove(); }, 500);
  }
}

// ============================================================
// KIMLIK DOGRULAMA
// ============================================================
let authListenersAttached = false;

async function initAuth() {
  if (!firebaseReady || !window._fb) {
    console.error('Firebase kullanilamiyor');
    hideSplash();
    showLogin();
    return;
  }

  try {
    const { onAuthStateChanged } = window._fb;

    if (authListenersAttached) return;
    authListenersAttached = true;

    onAuthStateChanged(auth, async (user) => {
      hideSplash();
      if (!user) {
        state.currentUser = null;
        state.appInitialized = false;
        state.girls = [];
        state.attendanceData = {};
        showLogin();
        return;
      }
      state.currentUser = user;
      showApp(user);
      if (!state.appInitialized) {
        state.appInitialized = true;
        await loadData();
        renderPage();
      }
    });
  } catch (e) {
    console.error('Kimlik dogrulama hatasi:', e);
    hideSplash();
    showLogin();
  }
}

// Fallback: eger DOM.googleSignIn null ise (script head'de calisti), 
// tekrar dene sayfa tam yuklendiginde
if (!DOM.googleSignIn) {
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('googleSignIn');
    if (btn && !btn._hasClickHandler) {
      console.log('DOMContentLoaded: googleSignIn bulundu, delegation zaten aktif.');
    }
  });
}

// ============================================================
// KIMLIK DOGRULAMA - Google Sign-In (Real Handler)
// ============================================================

async function handleGoogleSignIn(e) {
  console.log('handleGoogleSignIn called');

  const btn = e.target.closest ? e.target.closest('#googleSignIn') : document.getElementById('googleSignIn');
  if (!btn) {
    alert('Button not found!');
    return;
  }

  // Immediate feedback for mobile users
  try {
    showToast('Giris baslatiliyor...', 'info');
  } catch (err) {
    console.error('Toast failed:', err);
  }

  if (!firebaseReady || !window._fb) {
    try { showToast('Sistem hazirlaniyor, lutfen bekleyin...', 'warning'); } catch(e){}
    const ok = await initModules();
    if (!ok || !firebaseReady) {
      try { showToast('Internet baglantisi yok - cevrimdisi modu kullanin', 'error'); } catch(e){}
      alert('Internet baglantisi yok - cevrimdisi modu kullanin');
      btn.classList.remove('is-loading');
      return;
    }
  }

  btn.classList.add('is-loading');
  try {
    const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    await signInWithPopup(auth, provider);
  } catch (e) {
    btn.classList.remove('is-loading');
    console.error('Giris hatasi:', e.code, e.message);
    const errorMessages = {
      'auth/popup-blocked': 'Acilir pencere engellendi. Lutfen acilir pencerelere izin verin.',
      'auth/popup-closed-by-user': 'Giris penceresi kapatildi.',
      'auth/cancelled-popup-request': 'Giris istegi iptal edildi.',
      'auth/network-request-failed': 'Ag baglantisi basarisiz. Internet baglantinizi kontrol edin.',
      'auth/invalid-api-key': 'API anahtari gecersiz.',
      'auth/operation-not-supported-in-this-environment': 'Bu ortamda islem desteklenmiyor.'
    };
    const userMsg = errorMessages[e.code] || ('Giris basarisiz: ' + (e.message || e.code));
    try { showToast(userMsg, 'error'); } catch(err){}
    alert(userMsg);
  }
}

// Store real handler so inline HTML script can call it
window._realGoogleSignIn = handleGoogleSignIn;

// NOTE: Do NOT override handleGoogleSignInInline - the inline HTML handler is the primary one
// window.handleGoogleSignInInline is defined in index.html and works independently

// Fallback: bind via addEventListener after page load
window.addEventListener('load', () => {
  const btn = document.getElementById('googleSignIn');
  if (btn && !btn._bound) {
    btn._bound = true;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleGoogleSignIn(e);
    });
  }
});

if (DOM.signOutBtn) {
  DOM.signOutBtn.addEventListener('click', async () => {
    if (!firebaseReady || !window._fb) {
      state.currentUser = null;
      state.appInitialized = false;
      showLogin();
      return;
    }
    try {
      const { signOut } = window._fb;
      await signOut(auth);
    } catch (e) {
      console.error('Cikis hatasi:', e);
      state.currentUser = null;
      state.appInitialized = false;
      showLogin();
    }
  });
}

function showApp(user) {
  if (DOM.loginScreen) DOM.loginScreen.classList.add('hidden');
  if (DOM.mainApp) DOM.mainApp.classList.remove('hidden');
  if (DOM.googleSignIn) DOM.googleSignIn.classList.remove('is-loading');
  const card = document.getElementById('loginCard');
  if (card) {
    card.classList.remove('animate-in');
    card.querySelectorAll('.animate-in').forEach(el => el.classList.remove('animate-in'));
  }
  const initial = user && user.displayName ? user.displayName[0] : 'K';
  if (DOM.userAvatar) DOM.userAvatar.textContent = initial;
  if (DOM.drawerAvatar) DOM.drawerAvatar.textContent = initial;
  if (DOM.drawerUserName) DOM.drawerUserName.textContent = (user && user.displayName) || 'Kullanici';
  if (DOM.drawerUserEmail) DOM.drawerUserEmail.textContent = (user && user.email) || '';
}

function showLogin() {
  if (DOM.loginScreen) DOM.loginScreen.classList.remove('hidden');
  if (DOM.mainApp) DOM.mainApp.classList.add('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const card = document.getElementById('loginCard');
      if (card) {
        card.classList.add('animate-in');
        card.querySelectorAll('.login-brand, .login-brand-icon, .login-brand-name, .login-motto, .login-divider, .login-divider span, .login-welcome, .btn-google').forEach(el => {
          el.classList.add('animate-in');
        });
      }
    });
  });
}

// ============================================================
// FIREBASE DINLEYICILER
// ============================================================
let dataListenersInitialized = false;

async function loadData() {
  try {
    if (!firebaseReady || !window._fb) return;
    if (dataListenersInitialized) return;
    dataListenersInitialized = true;

    const { onSnapshot: _onSnapshot, query: _query, collection: _collection, orderBy: _orderBy } = window._fb;

    _onSnapshot(_query(_collection(db, 'girls'), _orderBy('name')), snap => {
      let changed = false;
      for (const change of snap.docChanges()) {
        const g = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'removed' || g.isDeleted) {
          state.girls = state.girls.filter(x => x.id !== g.id);
          changed = true;
        } else {
          const idx = state.girls.findIndex(x => x.id === g.id);
          idx >= 0 ? (state.girls[idx] = g) : state.girls.push(g);
          changed = true;
        }
      }
      state.girls.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      if (changed) scheduleRender();
    });

    _onSnapshot(_query(_collection(db, 'attendance'), _orderBy('date', 'desc')), snap => {
      let changed = false;
      for (const change of snap.docChanges()) {
        const a = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'removed') {
          delete state.attendanceData[a.id];
          changed = true;
        } else {
          state.attendanceData[a.id] = a;
          changed = true;
        }
      }
      if (changed) scheduleRender();
    });

    // Gecmis koleksiyonunu dinle ve IndexedDB ile senkronize et
    _onSnapshot(_query(_collection(db, 'history'), _orderBy('timestamp', 'desc')), async snap => {
      let changed = false;
      for (const change of snap.docChanges()) {
        const log = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'removed') {
          try { await IDB.delete('history', log.id); } catch (e) { }
          changed = true;
        } else {
          try { await IDB.add('history', log); } catch (e) { }
          changed = true;
        }
      }
      if (changed && state.currentPage === 'history') renderHistory(false);
    });
  } catch (e) { console.error('Yukleme hatasi:', e); }
}

// ============================================================
// RENDER MOTORU
// ============================================================
function scheduleRender() {
  clearTimeout(state.renderTimeout);
  state.renderTimeout = setTimeout(() => renderPage(), 60);
}

function renderPage() {
  switch (state.currentPage) {
    case 'home': renderHome(); break;
    case 'attendance': renderAttendancePage(); break;
    case 'girls': renderGirlsList(); break;
    case 'calendar': renderCalendar(); break;
    case 'stats': renderStats(); break;
    case 'history': renderHistory(false); break;
    case 'export': renderExport(); break;
  }
}

// ============================================================
// NAVIGASYON
// ============================================================
const PAGE_TITLES = {
  home: ['Ana Sayfa', ''],
  attendance: ['Gunluk Yoklama', 'Yoklama kaydet ve yonet'],
  girls: ['Calisanlar', 'Calisan listesi'],
  calendar: ['Aylik Takvim', 'Calisma gunleri'],
  stats: ['Istatistikler', 'Analiz ve raporlar'],
  history: ['Gecmis', 'Islem kayitlari'],
  export: ['Disari Aktar', 'Verileri disari aktar']
};

function navigateTo(page) {
  const pageEl = $(`page-${page}`);
  if (!pageEl) {
    console.warn(`Sayfa bulunamadi: page-${page}`);
    return;
  }

  $$('.page').forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $$('.menu-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const [title, sub] = PAGE_TITLES[page] || [page, ''];
  if (DOM.pageTitle) DOM.pageTitle.textContent = title;
  if (DOM.pageSubtitle) DOM.pageSubtitle.textContent = sub;
  state.currentPage = page;

  if (page === 'attendance') {
    state.attendancePageInitialized = false;
  }
  if (page !== 'calendar') {
    hideDayDetail();
  }

  renderPage();
  closeDrawer();
}

// Event delegation for nav buttons (works even if elements added after script load)
document.addEventListener('click', function(e) {
  var navBtn = e.target.closest('.nav-btn');
  if (navBtn && navBtn.dataset.page) {
    navigateTo(navBtn.dataset.page);
    return;
  }
  var menuItem = e.target.closest('.menu-item[data-page]');
  if (menuItem) {
    e.preventDefault();
    navigateTo(menuItem.dataset.page);
    return;
  }
  var menuBtn = e.target.closest('#menuBtn');
  if (menuBtn) {
    openDrawer();
    return;
  }
  var overlay = e.target.closest('#drawerOverlay');
  if (overlay) {
    closeDrawer();
    return;
  }
});

// Fallback direct listeners (if elements exist at load time)
if (DOM.menuBtn) DOM.menuBtn.addEventListener('click', openDrawer);
if (DOM.drawerOverlay) DOM.drawerOverlay.addEventListener('click', closeDrawer);

// Expose navigateTo globally for HTML onclick
window.navigateTo = navigateTo;

function openDrawer() {
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('show');
}
function closeDrawer() {
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}
// Expose globally for HTML onclick attributes
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;

// ============================================================
// ANA SAYFA
// ============================================================
function renderHome() {
  const now = new Date();
  const dayName = DateUtil.dayName(now);
  const dateStr = DateUtil.toStr(now);
  const monthStr = DateUtil.getMonthStr(now);

  if (DOM.todayDay) DOM.todayDay.textContent = `${DateUtil.formatDateShort(now)} ${dayName}`;
  if (DOM.todayDate) DOM.todayDate.textContent = now.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  const normalized = DateUtil.normalize(dayName);
  const isService = SERVICE_DAYS[normalized];

  if (DOM.todayServiceBadge) {
    DOM.todayServiceBadge.textContent = isService ? 'Calisma gunu \u2713' : 'Bugun tatil';
    DOM.todayServiceBadge.classList.toggle('active', isService);
  }

  let activeGirls = state.girls.filter(g => !g.isDeleted);
  const activeGirlIds = new Set(activeGirls.map(g => g.id));

  if (DOM.statTotal) DOM.statTotal.textContent = activeGirls.length;

  const presentGirlIds = new Set();
  const absentGirlIds = new Set();
  const todayRecordsByGirl = {};

  // Bugun icin tum yoklama kayitlarini topla
  Object.values(state.attendanceData).forEach(a => {
    if (a.date !== dateStr) return;
    if (!activeGirlIds.has(a.girlId)) return;
    if (!todayRecordsByGirl[a.girlId]) todayRecordsByGirl[a.girlId] = [];
    todayRecordsByGirl[a.girlId].push(a);
  });

  // Her calisanin bugunku durumunu kontrol et
  activeGirls.forEach(g => {
    const records = todayRecordsByGirl[g.id];
    if (records && records.length > 0) {
      const hasAnyPresent = records.some(r => r.status === 'Var');
      if (hasAnyPresent) presentGirlIds.add(g.id);
      else absentGirlIds.add(g.id);
    } else if (isService) {
      // Calisma gunu ve kayit yok = otomatik yok say
      absentGirlIds.add(g.id);
    }
  });

  if (DOM.statPresentToday) DOM.statPresentToday.textContent = presentGirlIds.size;
  if (DOM.statAbsentToday) DOM.statAbsentToday.textContent = absentGirlIds.size;

  // === Bu Ay En Cok Gelenler ===
  const presentDatesByGirl = {};
  activeGirls.forEach(g => presentDatesByGirl[g.id] = new Set());
  Object.values(state.attendanceData).forEach(a => {
    if (a.date?.startsWith(monthStr) && a.status === 'Var' && presentDatesByGirl[a.girlId] !== undefined) {
      presentDatesByGirl[a.girlId].add(a.date);
    }
  });
  const counts = {};
  Object.entries(presentDatesByGirl).forEach(([id, dateSet]) => { counts[id] = dateSet.size; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (DOM.topAttendees) {
    if (!sorted.length || !sorted[0][1]) {
      DOM.topAttendees.innerHTML = '<div class="empty-state">Bu ay yoklama verisi yok</div>';
    } else {
      const frag = document.createDocumentFragment();
      sorted.forEach(([id, count], i) => {
        if (!count) return;
        const g = state.girls.find(x => x.id === id);
        if (!g) return;
        const div = document.createElement('div');
        div.className = 'top-item';
        div.innerHTML = `<span class="top-rank">${i + 1}</span><span class="top-name">${esc(g.name)}</span><span class="top-count">${count} gun</span>`;
        frag.appendChild(div);
      });
      DOM.topAttendees.innerHTML = '';
      DOM.topAttendees.appendChild(frag);
    }
  }

  // === Takip Gerektirenler (ardisik devamsizlik) ===
  if (DOM.needsFollowup) {
    const followupGirls = [];
    activeGirls.forEach(g => {
      const result = hasConsecutiveAbsences(g.id, monthStr);
      if (result.hasConsecutive) {
        followupGirls.push({ girl: g, ...result });
      }
    });

    if (followupGirls.length === 0) {
      DOM.needsFollowup.innerHTML = '<div class="empty-state">Bu ay takip gerektiren calisan yok \u2705</div>';
    } else {
      const frag = document.createDocumentFragment();
      followupGirls.forEach(({ girl, count }) => {
        const div = document.createElement('div');
        div.className = 'followup-item';
        div.dataset.girlId = girl.id;
        div.innerHTML = `<span class="followup-name">${esc(girl.name)}</span><span class="followup-badge">${count} ardisik devamsizlik</span>`;
        frag.appendChild(div);
      });
      DOM.needsFollowup.innerHTML = '';
      DOM.needsFollowup.appendChild(frag);
    }
  }
}

// ============================================================
// ARAMA
// ============================================================
function debouncedSearch() {
  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    const q = DOM.globalSearch ? DOM.globalSearch.value.trim() : '';
    const resultsEl = DOM.searchResults;
    if (!resultsEl) return;
    if (!q) { resultsEl.classList.remove('show'); resultsEl.innerHTML = ''; return; }
    const qNorm = normalizeTurkish(q);
    const matches = state.girls.filter(g => !g.isDeleted && normalizeTurkish(g.name).includes(qNorm));
    resultsEl.innerHTML = matches.length
      ? matches.map(g => `<div class="search-item" data-girl-id="${esc(g.id)}"><span>${esc(g.name)}</span><span class="grade-badge">${esc(g.grade)}</span></div>`).join('')
      : '<div class="search-item">Sonuc bulunamadi</div>';
    resultsEl.classList.add('show');
  }, 250);
}

if (DOM.globalSearch) DOM.globalSearch.addEventListener('input', debouncedSearch);

// ============================================================
// CALISANLAR SAYFASI
// ============================================================
function renderGirlsList() {
  const searchQuery = (state.girlsSearchQuery || '').trim();
  let activeGirls = state.girls.filter(g => !g.isDeleted);

  if (searchQuery) {
    const qNorm = normalizeTurkish(searchQuery);
    activeGirls = activeGirls.filter(g => normalizeTurkish(g.name).includes(qNorm));
  }

  const filtered = activeGirls;
  const el = DOM.girlsList;
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state">Calisan bulunmadi<br><small>Yeni calisan eklemek icin + tusuna basin</small></div>';
    return;
  }
  const monthStr = DateUtil.getMonthStr(new Date());
  const frag = document.createDocumentFragment();
  filtered.forEach(g => {
    const presents = Object.values(state.attendanceData).filter(a =>
      a.girlId === g.id && a.date?.startsWith(monthStr) && a.status === 'Var'
    ).length;
    const absents = Object.values(state.attendanceData).filter(a =>
      a.girlId === g.id && a.date?.startsWith(monthStr) && a.status === 'Yok'
    ).length;
    const div = document.createElement('div');
    div.className = 'girl-card';
    div.dataset.girlId = g.id;
    div.innerHTML = `
      <div class="girl-avatar">${esc(g.name[0])}</div>
      <div class="girl-info">
        <span class="girl-name">${esc(g.name)}</span>
        <span class="girl-grade">${esc(g.grade)}</span>
        ${g.phone ? `<a href="tel:${esc(g.phone)}" class="girl-phone-link" data-phone="${esc(g.phone)}" onclick="event.stopPropagation();">${esc(g.phone)}</a>` : ''}
        <div class="girl-stats"><span class="green-text">&#10003;${presents}</span><span class="red-text">&#10007;${absents}</span></div>
      </div>
      <button class="edit-btn" data-girl-id="${esc(g.id)}" aria-label="${esc(g.name)} duzenle">&#9999;</button>`;
    frag.appendChild(div);
  });
  el.innerHTML = '';
  el.appendChild(frag);
}

if (DOM.addGirlBtn) {
  DOM.addGirlBtn.addEventListener('click', () => {
    state.editingGirlId = null;
    if (DOM.girlModalTitle) DOM.girlModalTitle.textContent = 'Calisan Ekle';
    if (DOM.girlName) DOM.girlName.value = '';
    if (DOM.girlPhone) DOM.girlPhone.value = '';
    if (DOM.girlNotes) DOM.girlNotes.value = '';
    if (DOM.deleteGirlBtn) DOM.deleteGirlBtn.classList.add('hidden');
    resetTimestampInputs();
    openModal('girlModal');
  });
}

function editGirl(id) {
  const g = state.girls.find(x => x.id === id);
  if (!g || g.isDeleted) return;
  state.editingGirlId = id;
  if (DOM.girlModalTitle) DOM.girlModalTitle.textContent = 'Calisan Bilgilerini Duzenle';
  if (DOM.girlName) DOM.girlName.value = g.name;
  if (DOM.girlPhone) DOM.girlPhone.value = g.phone || '';
  if (DOM.girlNotes) DOM.girlNotes.value = g.notes || '';
  if (DOM.deleteGirlBtn) DOM.deleteGirlBtn.classList.remove('hidden');
  resetTimestampInputs();
  openModal('girlModal');
}

if (DOM.deleteGirlBtn) {
  DOM.deleteGirlBtn.addEventListener('click', async () => {
    if (!state.editingGirlId || state.deleteInProgress) return;
    const g = state.girls.find(x => x.id === state.editingGirlId);
    if (!g) return;

    closeModal('girlModal');

    showConfirm({
      icon: '&#9888;', title: 'Calisan Sil',
      msg: `"${esc(g.name)}" silmek istediginizden emin misiniz?`,
      okLabel: 'Sil',
      okClass: 'confirm-delete',
      onOk: async () => {
        if (state.deleteInProgress) return;
        state.deleteInProgress = true;

        try {
          const id = state.editingGirlId;
          state.girls = state.girls.filter(x => x.id !== id);
          const attKeys = Object.keys(state.attendanceData).filter(k => state.attendanceData[k].girlId === id);
          attKeys.forEach(k => delete state.attendanceData[k]);

          try {
            const { setDoc, doc, collection, query, where, getDocs, writeBatch } = window._fb;
            const deleteData = {
              isDeleted: true, deletedAt: Date.now(),
              deletedBy: state.currentUser?.email || '',
              name: g.name, grade: g.grade
            };

            if (navigator.onLine) {
              await setDoc(doc(db, 'girls', id), deleteData, { merge: true });

              const attQuery = query(collection(db, 'attendance'), where('girlId', '==', id));
              const attSnap = await getDocs(attQuery);
              if (!attSnap.empty) {
                const docs = attSnap.docs;
                for (let i = 0; i < docs.length; i += 500) {
                  const batch = writeBatch(db);
                  docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
                  await batch.commit();
                }
              }
            } else {
              await OfflineQueue.add({ type: 'deleteGirl', data: { id, ...deleteData } });
            }
          } catch (e) {
            console.error('Firestore silme hatasi:', e);
            await OfflineQueue.add({
              type: 'deleteGirl',
              data: { id, isDeleted: true, deletedAt: Date.now(), deletedBy: state.currentUser?.email || '', name: g.name, grade: g.grade }
            });
          }

          await logHistory('Silme', `${g.name} - ${g.grade}`);
          showToast(`${g.name} silindi`, 'success');
          state.editingGirlId = null;
          scheduleRender();
        } catch (err) {
          console.error('Silme hatasi:', err);
          showToast('Silme sirasinda bir hata olustu', 'error');
        } finally {
          state.deleteInProgress = false;
        }
      }
    });
  });
}

// ============================================================
// ZAMAN DILIMI DEGISTIRME
// ============================================================
let timestampMode = 'auto';

function initTimestampToggle() {
  const toggle = document.getElementById('timestampToggle');
  const inputs = document.getElementById('timestampInputs');
  const autoMsg = document.getElementById('timestampAutoMsg');
  const dateInput = document.getElementById('girlDate');
  const timeInput = document.getElementById('girlTime');

  if (!toggle) return;

  timestampMode = 'auto';
  updateTimestampUI();

  toggle.addEventListener('click', (e) => {
    const option = e.target.closest('.ts-option');
    if (!option) return;
    timestampMode = option.dataset.mode;
    updateTimestampUI();
  });

  function updateTimestampUI() {
    toggle.querySelectorAll('.ts-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.mode === timestampMode);
    });
    if (timestampMode === 'auto') {
      if (inputs) inputs.classList.add('hidden');
      if (autoMsg) autoMsg.style.display = 'block';
    } else {
      if (inputs) inputs.classList.remove('hidden');
      if (autoMsg) autoMsg.style.display = 'none';
      if (dateInput && !dateInput.value) {
        const now = new Date();
        dateInput.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      }
      if (timeInput && !timeInput.value) {
        const now = new Date();
        timeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      }
    }
  }
}

function getTimestampFromInputs() {
  if (timestampMode === 'auto') {
    return Date.now();
  }
  const dateInput = document.getElementById('girlDate');
  const timeInput = document.getElementById('girlTime');
  if (dateInput && timeInput && dateInput.value && timeInput.value) {
    const ts = new Date(dateInput.value + 'T' + timeInput.value + ':00').getTime();
    return isNaN(ts) ? Date.now() : ts;
  }
  return Date.now();
}

function resetTimestampInputs() {
  const dateInput = document.getElementById('girlDate');
  const timeInput = document.getElementById('girlTime');
  if (dateInput) dateInput.value = '';
  if (timeInput) timeInput.value = '';
  timestampMode = 'auto';
  const toggle = document.getElementById('timestampToggle');
  if (toggle) {
    toggle.querySelectorAll('.ts-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.mode === 'auto');
    });
  }
  const inputs = document.getElementById('timestampInputs');
  const autoMsg = document.getElementById('timestampAutoMsg');
  if (inputs) inputs.classList.add('hidden');
  if (autoMsg) autoMsg.style.display = 'block';
}

// ============================================================
// CALISAN KAYDET - cevrimdisi destekli ve ozel zaman damgasi
// ============================================================
if (DOM.saveGirlBtn) {
  DOM.saveGirlBtn.addEventListener('click', async () => {
    if (state.savingGirl) return;
    state.savingGirl = true;
    try {
      const name = DOM.girlName ? DOM.girlName.value.trim() : '';
      const phone = DOM.girlPhone ? DOM.girlPhone.value.trim() : '';
      const notes = DOM.girlNotes ? DOM.girlNotes.value.trim() : '';

      if (!name) { showToast('Lutfen calisan adini girin', 'error'); return; }

      const normalizedName = normalizeName(name);
      const existingGirl = state.girls.find(g =>
        normalizeName(g.name) === normalizedName && g.id !== state.editingGirlId && !g.isDeleted
      );
      if (existingGirl) { showToast('Bu calisan zaten mevcut', 'error'); return; }

      const id = state.editingGirlId || 'girl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const customTimestamp = getTimestampFromInputs();

      const girlData = {
        id, name, phone, grade: 'Calisan', notes,
        createdAt: state.editingGirlId ? (state.girls.find(g => g.id === state.editingGirlId)?.createdAt || customTimestamp) : customTimestamp,
        updatedAt: customTimestamp,
        updatedBy: state.currentUser?.displayName || 'Kullanici',
        updatedByEmail: state.currentUser?.email || '',
        isDeleted: false
      };

      if (state.editingGirlId) {
        state.girls = state.girls.map(g => g.id === id ? girlData : g);
      } else {
        state.girls.push(girlData);
      }

      await logHistory(state.editingGirlId ? 'Duzenleme' : 'Ekleme', `${name} - Calisan`, customTimestamp);

      if (navigator.onLine && firebaseReady && window._fb) {
        try {
          await window._fb.setDoc(window._fb.doc(db, 'girls', id), girlData);
        } catch (e) {
          console.error('Firestore kaydetme hatasi:', e);
          await OfflineQueue.add({ type: 'saveGirl', data: girlData });
        }
      } else {
        await OfflineQueue.add({ type: 'saveGirl', data: girlData });
      }

      closeModal('girlModal');
      showToast(state.editingGirlId ? 'Bilgiler guncellendi' : 'Calisan eklendi', 'success');
      state.editingGirlId = null;
      resetTimestampInputs();
      renderPage();
    } finally {
      state.savingGirl = false;
    }
  });
}

// ============================================================
// CALISAN PROFILI
// ============================================================
function showGirlProfile(id) {
  const g = state.girls.find(x => x.id === id);
  if (!g || g.isDeleted) return;
  state.currentProfileGirlId = id;
  if (DOM.profileName) DOM.profileName.textContent = g.name;

  const girlAtt = Object.values(state.attendanceData).filter(a => a.girlId === id);
  girlAtt.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRecords = girlAtt.length;
  const presentCount = girlAtt.filter(a => a.status === 'Var').length;
  const absentCount = girlAtt.filter(a => a.status === 'Yok').length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
  const lastAttendance = girlAtt.find(a => a.status === 'Var');
  const lastDate = lastAttendance ? lastAttendance.date : '-';

  const months = {};
  girlAtt.forEach(a => {
    const m = a.date?.substring(0, 7);
    if (!m) return;
    if (!months[m]) months[m] = [];
    months[m].push(a);
  });

  let html = `<div class="profile-info">
    <span class="grade-badge">${esc(g.grade)}</span>
    ${g.phone ? `<span class="profile-phone">&#128222; ${esc(g.phone)}</span>` : ''}
    ${g.notes ? `<p class="profile-notes">${esc(g.notes)}</p>` : ''}
  </div>`;

  html += `<div class="profile-dashboard">
    <div class="profile-stat"><div class="ps-value green">${presentCount}</div><div class="ps-label">Devam Sayisi</div></div>
    <div class="profile-stat"><div class="ps-value red">${absentCount}</div><div class="ps-label">Devamsizlik Sayisi</div></div>
    <div class="profile-stat"><div class="ps-value orange">${attendanceRate}%</div><div class="ps-label">Devam Orani</div></div>
    <div class="profile-stat"><div class="ps-value">${totalRecords}</div><div class="ps-label">Toplam Kayit</div></div>
    <div class="profile-stat"><div class="ps-value">${lastDate}</div><div class="ps-label">Son Devam</div></div>
  </div>`;

  if (!Object.keys(months).length) {
    html += '<div class="empty-state">Yoklama kaydi bulunmuyor</div>';
  } else {
    Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).forEach(([month, records]) => {
      const presents = records.filter(r => r.status === 'Var').length;
      const absents = records.filter(r => r.status === 'Yok').length;
      html += `<div class="profile-month">
        <div class="profile-month-header">
          <span>${DateUtil.formatMonth(month)}</span>
          <span class="green-text">&#10003;${presents}</span>
          <span class="red-text">&#10007;${absents}</span>
        </div>
        <div class="profile-records">
          ${records.map(r => {
            return `<div class="profile-record">
              <span class="rec-date">${esc(r.date)} ${esc(DAY_NAMES[new Date(r.date + 'T00:00:00').getDay()] || '')}</span>
              <span class="rec-status ${r.status === 'Var' ? 'present' : 'absent'}">${esc(r.status)}</span>
              ${r.notes ? `<span class="rec-notes">${esc(r.notes)}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
  }
  if (DOM.profileBody) DOM.profileBody.innerHTML = html;
  openModal('girlProfileModal');
}

if (DOM.closeProfileModal) DOM.closeProfileModal.addEventListener('click', () => closeModal('girlProfileModal'));
if (DOM.editProfileBtn) {
  DOM.editProfileBtn.addEventListener('click', () => {
    closeModal('girlProfileModal');
    if (state.currentProfileGirlId) editGirl(state.currentProfileGirlId);
  });
}

if (DOM.shareProfileBtn) {
  DOM.shareProfileBtn.addEventListener('click', async () => {
    const id = state.currentProfileGirlId;
    if (!id) return;
    const g = state.girls.find(x => x.id === id);
    if (!g) return;

    const girlAtt = Object.values(state.attendanceData).filter(a => a.girlId === id);
    const presentCount = girlAtt.filter(a => a.status === 'Var').length;
    const absentCount = girlAtt.filter(a => a.status === 'Yok').length;
    const attendanceRate = girlAtt.length > 0 ? Math.round((presentCount / girlAtt.length) * 100) : 0;

    const shareText = `${g.name}
${g.grade}
\u2705 Devam: ${presentCount}
\u274C Devamsizlik: ${absentCount}
\uD83D\uDCCA Oran: ${attendanceRate}%
`.trim();

    if (navigator.share) {
      try { await navigator.share({ title: `${g.name} Profili`, text: shareText }); } catch (e) { /* kullanici iptal etti */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('Veriler paylasim icin kopyalandi', 'success');
      } catch (e) {
        showToast('Bu cihazda paylasim desteklenmiyor', 'warning');
      }
    }
  });
}

// ============================================================
// YOKLAMA SAYFASI
// ============================================================
function getCurrentServiceDay() {
  const dayOfWeek = new Date().getDay();
  return JS_DAY_TO_TURKISH[dayOfWeek] || null;
}

function isServiceDayDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return SERVICE_DAY_NUMBERS.includes(d.getDay());
}

function renderAttendancePage() {
  if (!DOM.attendanceDate) return;
  if (!DOM.attendanceDate.value) DOM.attendanceDate.value = DateUtil.toStr();

  const currentServiceDay = getCurrentServiceDay();
  if (currentServiceDay && !state.attendancePageInitialized) {
    state.selectedDay = currentServiceDay;
  }

  setActiveDay(state.selectedDay);

  const date = DOM.attendanceDate.value;
  const activeGirls = state.girls.filter(g => !g.isDeleted);

  const hasAnyRecordsForDate = activeGirls.some(g => {
    const key = `${g.id}_${date}_Genel`;
    return state.attendanceData[key];
  });

  if (activeGirls.length > 0 && !hasAnyRecordsForDate && isServiceDayDate(date) && !state.attendancePageInitialized) {
    state.attendancePageInitialized = true;
    markAllAbsentForDate(date);
    return;
  }

  state.attendancePageInitialized = true;
  renderAttendanceList();
}

function setActiveDay(day) {
  state.selectedDay = day;
  $$('.day-btn').forEach(b => b.classList.toggle('active', b.dataset.day === day));
}

$$('.day-btn').forEach(b => b.addEventListener('click', () => {
  setActiveDay(b.dataset.day);
  state.attendancePageInitialized = false;
  renderAttendancePage();
}));

if (DOM.attendanceDate) {
  DOM.attendanceDate.addEventListener('change', () => {
    state.attendancePageInitialized = false;
    renderAttendancePage();
  });
}

if (DOM.selectAllPresent) DOM.selectAllPresent.addEventListener('click', () => selectAllStatus('Var'));
if (DOM.selectAllAbsent) DOM.selectAllAbsent.addEventListener('click', () => selectAllStatus('Yok'));

function debouncedAttSearch() {
  clearTimeout(state.attSearchDebounceTimer);
  state.attSearchDebounceTimer = setTimeout(() => { renderAttendanceList(); }, 250);
}

if (DOM.attendanceSearch) DOM.attendanceSearch.addEventListener('input', debouncedAttSearch);

async function toggleAttendanceStatus(girlId, girlName, date) {
  const key = `${girlId}_${date}_Genel`;
  const existing = state.attendanceData[key];
  const newStatus = existing?.status === 'Var' ? 'Yok' : 'Var';

  const rec = {
    id: key,
    girlId: girlId,
    date,
    day: state.selectedDay,
    activity: 'Genel',
    status: newStatus,
    notes: existing?.notes || '',
    rating: existing?.rating || 0,
    updatedAt: Date.now(),
    updatedBy: state.currentUser?.displayName || 'Kullanici',
    updatedByEmail: state.currentUser?.email || ''
  };

  state.attendanceData[key] = rec;

  if (navigator.onLine && firebaseReady && window._fb) {
    try {
      await window._fb.setDoc(window._fb.doc(db, 'attendance', key), rec);
    } catch (e) {
      console.error('Yoklama kaydetme hatasi:', e);
      await OfflineQueue.add({ type: 'saveAttendance', data: rec });
    }
  } else {
    await OfflineQueue.add({ type: 'saveAttendance', data: rec });
  }

  renderAttendanceList();
  if (state.currentPage === 'home') renderHome();
  if (state.currentPage === 'stats') renderStats();
  if (state.currentPage === 'calendar') renderCalendar();
}

async function markAllAbsentForDate(date) {
  if (!isServiceDayDate(date)) return;

  const activeGirls = state.girls.filter(g => !g.isDeleted);
  if (activeGirls.length === 0) {
    renderAttendanceList();
    return;
  }

  const batchRecords = [];

  for (const g of activeGirls) {
    const key = `${g.id}_${date}_Genel`;
    if (!state.attendanceData[key]) {
      const rec = {
        id: key,
        girlId: g.id,
        date,
        day: state.selectedDay,
        activity: 'Genel',
        status: 'Yok',
        notes: '',
        rating: 0,
        updatedAt: Date.now(),
        updatedBy: state.currentUser?.displayName || 'Kullanici',
        updatedByEmail: state.currentUser?.email || ''
      };
      batchRecords.push(rec);
    }
  }

  for (const rec of batchRecords) {
    state.attendanceData[rec.id] = rec;
  }

  if (navigator.onLine && firebaseReady && window._fb && batchRecords.length > 0) {
    try {
      const batch = window._fb.writeBatch(db);
      for (const rec of batchRecords) {
        batch.set(window._fb.doc(db, 'attendance', rec.id), rec);
      }
      await batch.commit();
    } catch (e) {
      console.error('Toplu yoklama kaydetme hatasi:', e);
      await OfflineQueue.add({ type: 'saveBatchAttendance', data: { records: batchRecords } });
    }
  } else if (batchRecords.length > 0) {
    await OfflineQueue.add({ type: 'saveBatchAttendance', data: { records: batchRecords } });
  }

  if (batchRecords.length > 0) {
    await logHistory('Yoklama', `Otomatik devamsizlik atandi: ${date} (${state.selectedDay})`);
    showToast('Calisma gunu icin otomatik devamsizlik atandi', 'info');
  }

  renderAttendanceList();
  if (state.currentPage === 'home') renderHome();
  if (state.currentPage === 'calendar') renderCalendar();
}

async function selectAllStatus(status) {
  if (!DOM.attendanceDate) return;
  const date = DOM.attendanceDate.value;
  if (!date) { showToast('Lutfen once tarih secin', 'error'); return; }

  const activeGirls = state.girls.filter(g => !g.isDeleted);
  const batchRecords = [];

  for (const g of activeGirls) {
    const key = `${g.id}_${date}_Genel`;
    const existing = state.attendanceData[key];
    const rec = {
      id: key,
      girlId: g.id,
      date,
      day: state.selectedDay,
      activity: 'Genel',
      status: status,
      notes: existing?.notes || '',
      rating: existing?.rating || 0,
      updatedAt: Date.now(),
      updatedBy: state.currentUser?.displayName || 'Kullanici',
      updatedByEmail: state.currentUser?.email || ''
    };
    batchRecords.push(rec);
    state.attendanceData[key] = rec;
  }

  if (navigator.onLine && firebaseReady && window._fb && batchRecords.length > 0) {
    try {
      const batch = window._fb.writeBatch(db);
      for (const rec of batchRecords) {
        batch.set(window._fb.doc(db, 'attendance', rec.id), rec);
      }
      await batch.commit();
    } catch (e) {
      console.error('Toplu yoklama kaydetme hatasi:', e);
      await OfflineQueue.add({ type: 'saveBatchAttendance', data: { records: batchRecords } });
    }
  } else if (batchRecords.length > 0) {
    await OfflineQueue.add({ type: 'saveBatchAttendance', data: { records: batchRecords } });
  }

  await logHistory('Yoklama', `${status === 'Var' ? 'Tumu Var' : 'Tumu Yok'} olarak isaretlendi - Genel - ${date}`);
  showToast(status === 'Var' ? 'Tum calisanlar var olarak isaretlendi' : 'Tum calisanlar yok olarak isaretlendi', 'success');
  renderAttendanceList();
  if (state.currentPage === 'home') renderHome();
  if (state.currentPage === 'stats') renderStats();
  if (state.currentPage === 'calendar') renderCalendar();
}

function renderAttendanceList() {
  if (!DOM.attendanceDate || !DOM.attendanceList) return;
  const date = DOM.attendanceDate.value;
  const el = DOM.attendanceList;
  if (!date) { el.innerHTML = '<div class="empty-state">Lutfen tarih secin</div>'; return; }

  let activeGirls = state.girls.filter(g => !g.isDeleted);
  const searchQuery = DOM.attendanceSearch?.value?.trim() || '';
  if (searchQuery) {
    const qNorm = normalizeTurkish(searchQuery);
    activeGirls = activeGirls.filter(g => normalizeTurkish(g.name).includes(qNorm));
  }

  let present = 0, absent = 0;
  const frag = document.createDocumentFragment();

  if (searchQuery && !activeGirls.length) {
    el.innerHTML = '<div class="empty-state">Arama sonucu bulunamadi</div>';
    if (DOM.presentCount) DOM.presentCount.textContent = 0;
    if (DOM.absentCount) DOM.absentCount.textContent = 0;
    if (DOM.totalCount) DOM.totalCount.textContent = 0;
    return;
  }

  if (!activeGirls.length) {
    el.innerHTML = '<div class="empty-state">Kayitli calisan yok<br><small>Once Calisanlar sayfasindan calisan ekleyin</small></div>';
    if (DOM.presentCount) DOM.presentCount.textContent = 0;
    if (DOM.absentCount) DOM.absentCount.textContent = 0;
    if (DOM.totalCount) DOM.totalCount.textContent = 0;
    return;
  }

  activeGirls.forEach(g => {
    const key = `${g.id}_${date}_Genel`;
    const rec = state.attendanceData[key];
    let statusClass = 'absent', statusIcon = '&#10007;', statusText = 'Yok';
    if (rec?.status === 'Var') { statusClass = 'present'; statusIcon = '&#10003;'; statusText = 'Var'; present++; }
    else { absent++; }

    const div = document.createElement('div');
    div.className = `att-item ${statusClass}`;
    div.dataset.girlId = g.id;
    div.dataset.attKey = key;
    div.dataset.girlName = g.name;

    div.innerHTML = `
      <div class="att-icon">${statusIcon}</div>
      <div class="att-info">
        <span class="att-name">${esc(g.name)}</span>
        ${rec?.notes ? `<span class="att-note">${esc(rec.notes)}</span>` : ''}
        ${rec?.rating > 0 ? `<span class="att-note">Degerlendirme: ${'\u2605'.repeat(rec.rating)}${'\u2606'.repeat(5 - rec.rating)}</span>` : ''}
      </div>
      <span class="att-status-text ${statusClass}">${statusText}</span>
      <button class="att-delete-btn" data-att-key="${esc(key)}" title="Kaydi sil">&#10060;</button>`;
    frag.appendChild(div);
  });

  el.innerHTML = '';
  el.appendChild(frag);
  if (DOM.presentCount) DOM.presentCount.textContent = present;
  if (DOM.absentCount) DOM.absentCount.textContent = absent;
  if (DOM.totalCount) DOM.totalCount.textContent = activeGirls.length;
}

async function deleteAttendanceRecord(key) {
  const rec = state.attendanceData[key];
  if (!rec) return;

  const g = state.girls.find(x => x.id === rec.girlId);
  const gName = g ? g.name : 'Calisan';

  showConfirm({
    icon: '&#9888;', title: 'Yoklama kaydini sil',
    msg: `${esc(gName)} icin ${esc(rec.date)} tarihli yoklama kaydini silmek istediginizden emin misiniz?`,
    okLabel: 'Sil',
    onOk: async () => {
      try {
        delete state.attendanceData[key];
        if (navigator.onLine && firebaseReady && window._fb) {
          try {
            await window._fb.deleteDoc(window._fb.doc(db, 'attendance', key));
          } catch (e) {
            console.error('Yoklama silme hatasi:', e);
            await OfflineQueue.add({ type: 'deleteAttendance', data: { key } });
          }
        } else {
          await OfflineQueue.add({ type: 'deleteAttendance', data: { key } });
        }
        await logHistory('Yoklama Silme', `${gName} - ${rec.date} - ${rec.activity} - ${rec.status}`);
        showToast('Yoklama kaydi silindi', 'success');
        renderAttendanceList();
        if (state.currentPage === 'stats') renderStats();
        if (state.currentPage === 'home') renderHome();
        if (state.currentPage === 'calendar') renderCalendar();
      } catch (err) {
        console.error('Yoklama silme hatasi:', err);
        showToast('Silme sirasinda bir hata olustu', 'error');
      }
    }
  });
}

// ============================================================
// YOKLAMA KAYIT MODAL (degerlendirme ile)
// ============================================================
function openAttendanceEntry(girlId, girlName, date) {
  state.currentAttendanceGirlId = girlId;
  state.currentAttendanceRating = 0;
  if (DOM.attendanceModalTitle) DOM.attendanceModalTitle.textContent = `${date}`;
  if (DOM.modalGirlName) DOM.modalGirlName.textContent = girlName;
  if (DOM.attendanceNotes) DOM.attendanceNotes.value = '';

  // Yildizlari sifirla
  $$('#starsInput .star').forEach(s => s.classList.remove('selected'));

  const key = `${girlId}_${date}_Genel`;
  const existing = state.attendanceData[key];
  if (existing) {
    $$('.attend-btn').forEach(b => b.classList.toggle('selected', b.dataset.status === existing.status));
    if (DOM.attendanceNotes) DOM.attendanceNotes.value = existing.notes || '';
    if (existing.rating > 0) {
      state.currentAttendanceRating = existing.rating;
      $$('#starsInput .star').forEach(s => {
        s.classList.toggle('selected', parseInt(s.dataset.rating) <= existing.rating);
      });
    }
    if (DOM.ratingSection) DOM.ratingSection.classList.toggle('hidden', existing.status !== 'Var');
  } else {
    $$('.attend-btn').forEach(b => b.classList.remove('selected'));
    if (DOM.ratingSection) DOM.ratingSection.classList.remove('hidden');
  }
  openModal('attendanceModal');
}

$$('.attend-btn').forEach(b => {
  b.addEventListener('click', () => {
    $$('.attend-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    if (DOM.ratingSection) DOM.ratingSection.classList.toggle('hidden', b.dataset.status !== 'Var');
  });
});

// Yildiz degerlendirme
$$('#starsInput .star').forEach(star => {
  star.addEventListener('click', () => {
    const rating = parseInt(star.dataset.rating);
    state.currentAttendanceRating = rating;
    $$('#starsInput .star').forEach(s => {
      s.classList.toggle('selected', parseInt(s.dataset.rating) <= rating);
    });
  });
});

if (DOM.saveAttendanceEntry) {
  DOM.saveAttendanceEntry.addEventListener('click', async () => {
    if (!DOM.attendanceDate) return;
    const date = DOM.attendanceDate.value;
    const statusBtn = document.querySelector('.attend-btn.selected');
    if (!statusBtn) { showToast('Lutfen Var veya Yok secin', 'error'); return; }

    const key = `${state.currentAttendanceGirlId}_${date}_Genel`;
    const rec = {
      id: key,
      girlId: state.currentAttendanceGirlId,
      date,
      day: state.selectedDay,
      activity: 'Genel',
      status: statusBtn.dataset.status,
      notes: DOM.attendanceNotes ? DOM.attendanceNotes.value.trim() : '',
      rating: statusBtn.dataset.status === 'Var' ? (state.currentAttendanceRating || 0) : 0,
      updatedAt: Date.now(),
      updatedBy: state.currentUser?.displayName || 'Kullanici',
      updatedByEmail: state.currentUser?.email || ''
    };

    state.attendanceData[key] = rec;

    if (navigator.onLine && firebaseReady && window._fb) {
      try {
        await window._fb.setDoc(window._fb.doc(db, 'attendance', key), rec);
      } catch (e) {
        console.error('Yoklama kaydetme hatasi:', e);
        await OfflineQueue.add({ type: 'saveAttendance', data: rec });
      }
    } else {
      await OfflineQueue.add({ type: 'saveAttendance', data: rec });
    }

    const gName = state.girls.find(g => g.id === state.currentAttendanceGirlId)?.name || '';
    await logHistory('Yoklama', `${gName} - Genel - ${date} - ${rec.status}`);
    closeModal('attendanceModal');
    showToast('Kaydedildi', 'success');
    renderAttendanceList();

    if (state.currentPage === 'home') renderHome();
    if (state.currentPage === 'stats') renderStats();
    if (state.currentPage === 'calendar') renderCalendar();
  });
}


// ============================================================
// TAKVIM SAYFASI
// ============================================================
function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  if (DOM.calMonthYear) DOM.calMonthYear.textContent = state.calendarDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = DateUtil.toStr();

  let html = '<div class="cal-weekdays">';
  ['Paz','Pzt','Sal','Crs','Prs','Cum','Cmt'].forEach(d => html += `<div class="cal-wday">${d}</div>`);
  html += '</div><div class="cal-days">';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${DateUtil.pad(month + 1)}-${DateUtil.pad(d)}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isService = SERVICE_DAY_NUMBERS.includes(dayOfWeek);
    const activeGirlIds = new Set(state.girls.filter(g => !g.isDeleted).map(g => g.id));
    const hasData = Object.values(state.attendanceData).some(a => a.date === dateStr && activeGirlIds.has(a.girlId));
    const isToday = dateStr === todayStr;
    html += `<div class="cal-day ${isService ? 'service-day' : ''} ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <span>${d}</span>${isService ? '<div class="service-dot"></div>' : ''}
    </div>`;
  }
  html += '</div>';
  if (DOM.calendarGrid) DOM.calendarGrid.innerHTML = html;

  // Bu ay gorunumundeyse bugunun detaylarini otomatik goster
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth()) {
    currentDayDetailDate = todayStr;
    refreshDayDetail();
  } else if (currentDayDetailDate) {
    refreshDayDetail();
  }
}

let currentDayDetailDate = null;

function showDayDetail(dateStr) {
  currentDayDetailDate = dateStr;
  refreshDayDetail();
}

function refreshDayDetail() {
  if (!currentDayDetailDate || !DOM.dayDetail) return;
  const dateStr = currentDayDetailDate;
  const records = Object.values(state.attendanceData).filter(a => a.date === dateStr);
  const el = DOM.dayDetail;

  const activeGirlIds = new Set(state.girls.filter(g => !g.isDeleted).map(g => g.id));
  const filteredRecords = records.filter(r => activeGirlIds.has(r.girlId));

  if (!filteredRecords.length) {
    el.innerHTML = `<div class="day-detail-header">${dateStr}</div><div class="empty-state">Bu gun icin kayit bulunmuyor</div>`;
  } else {
    const grouped = {};
    filteredRecords.forEach(r => { if (!grouped[r.activity || 'Genel']) grouped[r.activity || 'Genel'] = []; grouped[r.activity || 'Genel'].push(r); });
    let html = `<div class="day-detail-header">${dateStr}</div>`;
    Object.entries(grouped).forEach(([act, recs]) => {
      const presentCount = recs.filter(r => r.status === 'Var').length;
      const absentCount = recs.filter(r => r.status === 'Yok').length;
      html += `<div class="day-activity"><b>${esc(act)}</b>: <span class="green-text">${presentCount} Var</span> \u00B7 <span class="red-text">${absentCount} Yok</span> (toplam ${recs.length})</div>`;
    });
    el.innerHTML = html;
  }
  el.classList.add('show');
}

function hideDayDetail() {
  currentDayDetailDate = null;
  if (DOM.dayDetail) DOM.dayDetail.classList.remove('show');
}

if (DOM.calPrev) {
  DOM.calPrev.addEventListener('click', () => {
    hideDayDetail();
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  });
}
if (DOM.calNext) {
  DOM.calNext.addEventListener('click', () => {
    hideDayDetail();
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

// ============================================================
// AKTIVITE DETAY MODAL
// ============================================================
function openActivityDetailModal(activity, period, gradeFilter, customDate) {
  const { start, end } = getPeriodBounds(period, customDate);
  let activeGirls = state.girls.filter(g => !g.isDeleted);
  if (gradeFilter) activeGirls = activeGirls.filter(g => g.grade === gradeFilter);
  const activeGirlIds = new Set(activeGirls.map(g => g.id));
  const periodLabel = PERIOD_LABELS[period] || '';

  const records = Object.values(state.attendanceData).filter(a => {
    if (a.activity !== activity) return false;
    if (!activeGirlIds.has(a.girlId)) return false;
    if (a.date < start || a.date > end) return false;
    return true;
  });

  const byGirl = {};
  records.forEach(a => { if (!byGirl[a.girlId]) byGirl[a.girlId] = []; byGirl[a.girlId].push(a); });

  const presentGirls = [];
  const absentGirls = [];

  Object.entries(byGirl).forEach(([girlId, girlRecords]) => {
    girlRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    const girl = activeGirls.find(g => g.id === girlId);
    if (!girl) return;

    const pCount = girlRecords.filter(r => r.status === 'Var').length;
    const aCount = girlRecords.filter(r => r.status === 'Yok').length;
    const total = girlRecords.length;
    const rate = total > 0 ? Math.round((pCount / total) * 100) : 0;

    const entry = { girl, presentCount: pCount, absentCount: aCount, totalRecords: total, attendanceRate: rate, latestRecord: girlRecords[0] };
    if (pCount >= aCount) presentGirls.push(entry);
    else absentGirls.push(entry);
  });

  presentGirls.sort((a, b) => b.attendanceRate - a.attendanceRate || a.girl.name.localeCompare(b.girl.name, 'tr'));
  absentGirls.sort((a, b) => b.attendanceRate - a.attendanceRate || a.girl.name.localeCompare(b.girl.name, 'tr'));

  state.currentActivityDetail = { activity, period, presentGirls, absentGirls };
  state.activityDetailTab = 'present';

  if (DOM.activityDetailTitle) DOM.activityDetailTitle.textContent = `${activity} Detayi`;
  if (DOM.activityDetailIcon) DOM.activityDetailIcon.innerHTML = ACTIVITY_ICONS[activity] || '&#128202;';
  if (DOM.activityDetailName) DOM.activityDetailName.textContent = activity;
  if (DOM.activityDetailPeriod) DOM.activityDetailPeriod.textContent = periodLabel;
  if (DOM.activityDetailTotal) DOM.activityDetailTotal.textContent = presentGirls.length + absentGirls.length;
  if (DOM.presentTabCount) DOM.presentTabCount.textContent = presentGirls.length;
  if (DOM.absentTabCount) DOM.absentTabCount.textContent = absentGirls.length;

  renderActivityDetailTab();
  openModal('activityDetailModal');
}

function renderActivityDetailTab() {
  if (!state.currentActivityDetail) return;
  const { presentGirls, absentGirls } = state.currentActivityDetail;
  const isPresentTab = state.activityDetailTab === 'present';
  const list = isPresentTab ? presentGirls : absentGirls;

  $$('#activityDetailTabs .activity-detail-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === state.activityDetailTab);
  });

  const el = DOM.activityDetailList;
  if (!el) return;
  if (!list.length) {
    const msg = isPresentTab ? 'Belirtilen donemde devam eden calisan yok' : 'Belirtilen donemde devamsizlik olan calisan yok';
    el.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach(({ girl, presentCount, absentCount, totalRecords, attendanceRate, latestRecord }) => {
    const div = document.createElement('div');
    div.className = 'detail-girl-item';
    div.dataset.girlId = girl.id;
    div.innerHTML = `
      <div class="detail-girl-avatar">${esc(girl.name[0])}</div>
      <div class="detail-girl-info">
        <div class="detail-girl-name">${esc(girl.name)}</div>
        <div class="detail-girl-grade">${esc(girl.grade)} \u00B7 ${presentCount} devam \u00B7 ${absentCount} devamsizlik \u00B7 %${attendanceRate} oran \u00B7 son: ${esc(latestRecord.date)}</div>
      </div>
      <div class="detail-status-icon ${isPresentTab ? 'present' : 'absent'}">
        ${isPresentTab ? '&#10003;' : '&#10007;'}
      </div>`;
    frag.appendChild(div);
  });

  el.innerHTML = '';
  el.appendChild(frag);
}

if (DOM.activityDetailTabs) {
  DOM.activityDetailTabs.addEventListener('click', e => {
    const tab = e.target.closest('.activity-detail-tab');
    if (!tab) return;
    state.activityDetailTab = tab.dataset.tab;
    renderActivityDetailTab();
  });
}

if (DOM.activityDetailList) {
  DOM.activityDetailList.addEventListener('click', e => {
    const item = e.target.closest('.detail-girl-item');
    if (item && item.dataset.girlId) {
      closeModal('activityDetailModal');
      showGirlProfile(item.dataset.girlId);
    }
  });
}

if (DOM.closeActivityDetailModal) {
  DOM.closeActivityDetailModal.addEventListener('click', () => closeModal('activityDetailModal'));
}

// ============================================================
// ISTATISTIK SAYFASI
// ============================================================
function renderStats() {
  const selectedDate = DOM.statsMonth && DOM.statsMonth.value ? DOM.statsMonth.value : DateUtil.toStr();
  if (DOM.statsMonth && !DOM.statsMonth.value) DOM.statsMonth.value = selectedDate;

  const { start, end } = getStatsBounds();

  $$('#timeFilterTabs .time-filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === state.statsTimeFilter);
  });

  let activeGirls = state.girls.filter(g => !g.isDeleted);
  const activeGirlIds = new Set(activeGirls.map(g => g.id));

  const monthAtt = Object.values(state.attendanceData).filter(a =>
    a.date >= start && a.date <= end && activeGirlIds.has(a.girlId)
  );

  const totalSessions = new Set(monthAtt.map(a => a.date)).size;
  const presents = monthAtt.filter(a => a.status === 'Var').length;
  const absents = monthAtt.filter(a => a.status === 'Yok').length;

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { month: 'long', day: 'numeric' });

  if (DOM.bigStatsGrid) {
    DOM.bigStatsGrid.innerHTML = `
      <div class="big-stat-card"><div class="big-num">${activeGirls.length}</div><div>Calisan</div></div>
      <div class="big-stat-card"><div class="big-num">${totalSessions}</div><div>Kayitli Calisma Gunu</div></div>
      <div class="big-stat-card green-card"><div class="big-num">${presents}</div><div>Toplam Devam</div></div>
      <div class="big-stat-card red-card"><div class="big-num">${absents}</div><div>Toplam Devamsizlik</div></div>`;
  }

  const absenceByGirl = {};
  activeGirls.forEach(g => absenceByGirl[g.id] = 0);
  monthAtt.filter(a => a.status === 'Yok').forEach(a => {
    if (absenceByGirl[a.girlId] !== undefined) absenceByGirl[a.girlId]++;
  });
  const maxAbs = Math.max(...Object.values(absenceByGirl), 1);
  const sortedAbs = Object.entries(absenceByGirl).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (DOM.absenceChart) {
    DOM.absenceChart.innerHTML = sortedAbs.length
      ? sortedAbs.map(([id, count]) => {
        const g = state.girls.find(x => x.id === id);
        if (!g) return '';
        const pct = Math.round((count / maxAbs) * 100);
        return `<div class="chart-row">
          <span class="chart-name">${esc(g.name)}</span>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%"></div></div>
          <span class="chart-val">${count}</span>
        </div>`;
      }).join('')
      : `<div class="empty-state">${dateLabel} tarihine kadar devamsizlik bulunmuyor &#127881;</div>`;
  }

  const presentsByGirl = {};
  activeGirls.forEach(g => presentsByGirl[g.id] = 0);
  monthAtt.filter(a => a.status === 'Var').forEach(a => {
    if (presentsByGirl[a.girlId] !== undefined) presentsByGirl[a.girlId]++;
  });

  const sortedPresents = Object.entries(presentsByGirl)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (DOM.attendanceRanking) {
    DOM.attendanceRanking.innerHTML = sortedPresents.length
      ? sortedPresents.map(([id, count], i) => {
        const g = state.girls.find(x => x.id === id);
        if (!g) return '';
        return `<div class="rank-item">
          <span class="rank-num">${i + 1}</span>
          <span class="rank-name">${esc(g.name)}</span>
          <span class="rank-grade">${esc(g.grade)}</span>
          <span class="rank-count">${count} gun</span>
        </div>`;
      }).join('')
      : `<div class="empty-state">${dateLabel} tarihine kadar devam verisi bulunmuyor</div>`;
  }
}

if (DOM.statsMonth) DOM.statsMonth.addEventListener('change', renderStats);

if (DOM.timeFilterTabs) {
  DOM.timeFilterTabs.addEventListener('click', e => {
    const btn = e.target.closest('.time-filter-tab');
    if (!btn) return;
    state.statsTimeFilter = btn.dataset.period;
    renderStats();
  });
}

// ============================================================
// GECMIS SAYFASI
// ============================================================
async function renderHistory(append = false) {
  const el = DOM.historyList;
  const filter = DOM.historyFilter?.value || '';
  if (!el) return;

  if (!append) {
    el.innerHTML = '<div class="empty-state">Yukleniyor...</div>';
    state.historyOffset = 0;

    const allLogs = [];
    const seenIds = new Set();

    // 1. Once Firestore'dan al (cevrimici)
    if (firebaseReady && window._fb) {
      try {
        const snap = await window._fb.getDocs(
          window._fb.query(window._fb.collection(db, 'history'), window._fb.orderBy('timestamp', 'desc'))
        );
        snap.docs.forEach(d => {
          const log = { id: d.id, ...d.data() };
          if (!seenIds.has(log.id)) {
            seenIds.add(log.id);
            allLogs.push(log);
          }
        });
      } catch (e) { console.warn('Firestore gecmis yukleme hatasi:', e); }
    }

    // 2. IndexedDB'den de al (cevrimdisi kayitlari da kapsar)
    try {
      const idbLogs = await IDB.getAll('history');
      idbLogs.forEach(log => {
        if (!seenIds.has(log.id)) {
          seenIds.add(log.id);
          allLogs.push(log);
        }
      });
    } catch (e) { console.warn('IDB gecmis yukleme hatasi:', e); }

    // En yeniden en eskiye sirala
    allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Filtrele
    state.historyAllLogs = filter ? allLogs.filter(l => l.action && l.action.includes(filter)) : allLogs;
  }

  if (!state.historyAllLogs.length) {
    el.innerHTML = '<div class="empty-state">Gecmis kaydi bulunmuyor</div>';
    if (DOM.loadMoreHistory) DOM.loadMoreHistory.classList.add('hidden');
    return;
  }

  const slice = state.historyAllLogs.slice(state.historyOffset, state.historyOffset + HISTORY_PAGE_SIZE);
  state.historyOffset += slice.length;

  const html = slice.map(log => `
    <div class="history-item">
      <div class="history-icon">${getHistoryIcon(log.action)}</div>
      <div class="history-info">
        <span class="history-action">${esc(log.action)}</span>
        <span class="history-detail">${esc(log.detail)}</span>
        <span class="history-meta">${esc(log.by || 'Kullanici')} &middot; ${new Date(log.timestamp).toLocaleString('tr-TR')}</span>
      </div>
    </div>`).join('');

  if (!append) el.innerHTML = html;
  else el.insertAdjacentHTML('beforeend', html);

  if (DOM.loadMoreHistory) DOM.loadMoreHistory.classList.toggle('hidden', state.historyOffset >= state.historyAllLogs.length);
}

if (DOM.historyFilter) DOM.historyFilter.addEventListener('change', () => renderHistory(false));
if (DOM.loadMoreHistoryBtn) DOM.loadMoreHistoryBtn.addEventListener('click', () => renderHistory(true));

if (DOM.clearHistoryBtn) {
  DOM.clearHistoryBtn.addEventListener('click', () => {
    showConfirm({
      icon: '&#9888;', title: 'Gecmisi temizle',
      msg: 'Emin misiniz? Tum kayitlar kalici olarak silinecek ve geri alinamaz.',
      okLabel: 'Tumunu Temizle',
      onOk: async () => {
        try { await IDB.clear('history'); } catch (e) { console.warn('IDB temizleme hatasi:', e); }
        state.historyAllLogs = [];
        if (firebaseReady && window._fb) {
          try {
            const snap = await window._fb.getDocs(window._fb.collection(db, 'history'));
            if (snap.docs.length) {
              for (let i = 0; i < snap.docs.length; i += 500) {
                const batch = window._fb.writeBatch(db);
                snap.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
                await batch.commit();
              }
            }
          } catch (e) { console.error('Firestore gecmis temizleme hatasi:', e); }
        }
        showToast('Gecmis kayitlari temizlendi', 'success');
        renderHistory(false);
      }
    });
  });
}

function getHistoryIcon(action) {
  if (action.includes('Ekleme')) return '&#10133;';
  if (action.includes('Duzenleme')) return '&#9999;';
  if (action.includes('Silme')) return '&#10060;';
  if (action.includes('Yoklama')) return '&#128203;';
  return '&#128295;';
}

async function logHistory(action, detail, customTimestamp) {
  const ts = customTimestamp || Date.now();
  const log = {
    id: 'log_' + ts + '_' + Math.random().toString(36).slice(2, 7),
    action, detail,
    by: state.currentUser?.displayName || 'Kullanici',
    byEmail: state.currentUser?.email || '',
    timestamp: ts
  };
  // Once IndexedDB'ye kaydet (her zaman calisir, cevrimdisi dahil)
  try { await IDB.add('history', log); } catch (e) { console.warn('IDB gecmis kaydetme hatasi:', e); }
  // Firestore'a kaydet veya senkronizasyon kuyruguna ekle
  if (navigator.onLine && firebaseReady && window._fb) {
    try { await window._fb.setDoc(window._fb.doc(db, 'history', log.id), log); }
    catch (e) {
      await OfflineQueue.add({ type: 'saveHistory', data: log });
    }
  } else {
    await OfflineQueue.add({ type: 'saveHistory', data: log });
  }
}

// ============================================================
// DISARI AKTAR SAYFASI
// ============================================================
function renderExport() {
  if (DOM.exportMonth && !DOM.exportMonth.value) DOM.exportMonth.value = DateUtil.toStr();
}

// Excel aktarimi
if (DOM.exportCSV) {
  DOM.exportCSV.addEventListener('click', () => {
    if (!XLSX) { showToast('Excel kutuphanesi yuklenmedi, sayfayi yenileyin', 'error'); return; }

    const exportMode = document.querySelector('input[name="exportMode"]:checked')?.value || 'day';
    const exportDate = DOM.exportMonth.value || DateUtil.toStr();

    let exportStart, exportEnd, reportTitle;

    if (exportMode === 'month') {
      const [year, month] = exportDate.substring(0, 7).split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      exportStart = exportDate.substring(0, 7) + '-01';
      exportEnd = exportDate.substring(0, 7) + '-' + String(daysInMonth).padStart(2, '0');
      reportTitle = DateUtil.formatMonth(exportDate.substring(0, 7)) + ' ayi devam raporu';
    } else {
      exportStart = exportDate;
      exportEnd = exportDate;
      const dayName = DAY_NAMES[new Date(exportDate + 'T00:00:00').getDay()] || '';
      reportTitle = exportDate + ' (' + dayName + ') gunu devam raporu';
    }

    const activeGirlIds = new Set(state.girls.filter(g => !g.isDeleted).map(g => g.id));
    const exportAtt = Object.values(state.attendanceData).filter(a =>
      a.date >= exportStart && a.date <= exportEnd && activeGirlIds.has(a.girlId)
    );

    const wb = XLSX.utils.book_new();

    if (exportMode === 'month') {
      const monthName = DateUtil.formatMonth(exportDate.substring(0, 7));
      const wsData = [];
      wsData.push([monthName + ' Ayi Devam Raporu']);
      wsData.push([]);
      wsData.push(['Calisan Sayisi', activeGirlIds.size]);
      wsData.push([]);
      wsData.push(['Ad Soyad', 'Toplam Devam', 'Toplam Devamsizlik']);

      const grouped = {};
      exportAtt.forEach(a => {
        if (!grouped[a.girlId]) {
          const g = state.girls.find(x => x.id === a.girlId);
          grouped[a.girlId] = { name: g?.name || '', totalPresent: 0, totalAbsent: 0 };
        }
        if (a.status === 'Var') grouped[a.girlId].totalPresent++;
        else grouped[a.girlId].totalAbsent++;
      });

      const sortedGirls = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      sortedGirls.forEach(r => {
        wsData.push([r.name, r.totalPresent, r.totalAbsent]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
      ws['!dir'] = 'ltr';
      XLSX.utils.book_append_sheet(wb, ws, 'Ay Ozeti');

      // === Sayfa 2: Gunluk Detayli Kayitlar ===
      exportAtt.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.activity || '').localeCompare(b.activity || '', 'tr');
      });

      const detailData = [];
      detailData.push([monthName + ' - Detayli Rapor']);
      detailData.push([]);
      detailData.push(['Tarih', 'Gun', 'Calisan', 'Durum', 'Notlar']);

      exportAtt.forEach(a => {
        const g = state.girls.find(x => x.id === a.girlId);
        const dayName = DAY_NAMES[new Date(a.date + 'T00:00:00').getDay()] || '';
        detailData.push([a.date, dayName, g?.name || '', a.status === 'Var' ? '\u2713' : '\u2717', a.notes || '']);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 24 }];
      wsDetail['!dir'] = 'ltr';
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Gunluk Detaylar');

    } else {
      const wsData = [];
      wsData.push([reportTitle]);
      wsData.push([]);
      wsData.push(['Ad Soyad', 'Durum']);

      const activeGirls = state.girls.filter(g => !g.isDeleted).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      activeGirls.forEach(g => {
        const key = `${g.id}_${exportDate}_Genel`;
        const rec = state.attendanceData[key];
        const status = rec ? (rec.status === 'Var' ? '\u2713' : '\u2717') : '\u2014';
        wsData.push([g.name, status]);
      });

      const totalPresent = exportAtt.filter(a => a.status === 'Var').length;
      const totalAbsent = exportAtt.filter(a => a.status === 'Yok').length;
      wsData.push([]);
      wsData.push(['', '', 'Var: ' + totalPresent, '', 'Yok: ' + totalAbsent, '']);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      ws['!dir'] = 'ltr';
      XLSX.utils.book_append_sheet(wb, ws, exportDate + ' Gunu');
    }

    const xlsxBlob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Yoklama_${exportDate}${exportMode === 'month' ? '_Ay' : '_Gun'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(exportMode === 'month' ? 'Aylik Excel dosyasi olusturuldu' : 'Gunluk Excel dosyasi olusturuldu', 'success');
  });
}

if (DOM.exportJSON) {
  DOM.exportJSON.addEventListener('click', () => {
    const exportDate = DOM.exportMonth.value || DateUtil.toStr();
    const exportStart = exportDate.substring(0, 7) + '-01';
    const exportEnd = exportDate;
    const activeGirlIds = new Set(state.girls.filter(g => !g.isDeleted).map(g => g.id));
    const exportAtt = Object.values(state.attendanceData).filter(a =>
      a.date >= exportStart && a.date <= exportEnd && activeGirlIds.has(a.girlId)
    );
    const payload = {
      dateRange: { start: exportStart, end: exportEnd },
      girls: state.girls.filter(g => !g.isDeleted),
      attendance: exportAtt,
      exportedAt: new Date().toISOString()
    };
    downloadFile(`Veriler_${exportDate}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showToast('JSON olusturuldu', 'success');
  });
}

if (DOM.exportPrint) {
  DOM.exportPrint.addEventListener('click', () => {
    const exportMode = document.querySelector('input[name="exportMode"]:checked')?.value || 'day';
    const exportDate = DOM.exportMonth.value || DateUtil.toStr();

    let exportStart, exportEnd;
    if (exportMode === 'month') {
      const [year, month] = exportDate.substring(0, 7).split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      exportStart = exportDate.substring(0, 7) + '-01';
      exportEnd = exportDate.substring(0, 7) + '-' + String(daysInMonth).padStart(2, '0');
    } else {
      exportStart = exportDate;
      exportEnd = exportDate;
    }

    const activeGirlIds = new Set(state.girls.filter(g => !g.isDeleted).map(g => g.id));
    const exportAtt = Object.values(state.attendanceData).filter(a =>
      a.date >= exportStart && a.date <= exportEnd && activeGirlIds.has(a.girlId)
    );

    const activeGirls = state.girls.filter(g => !g.isDeleted);
    const totalPresent = exportAtt.filter(a => a.status === 'Var').length;
    const totalAbsent = exportAtt.filter(a => a.status === 'Yok').length;

    let html;

    if (exportMode === 'month') {
      const monthName = DateUtil.formatMonth(exportDate.substring(0, 7));

      const grouped = {};
      exportAtt.forEach(a => {
        if (!grouped[a.girlId]) {
          const g = state.girls.find(x => x.id === a.girlId);
          grouped[a.girlId] = { name: g?.name || '', totalPresent: 0, totalAbsent: 0 };
        }
        if (a.status === 'Var') grouped[a.girlId].totalPresent++;
        else grouped[a.girlId].totalAbsent++;
      });

      const sortedGirls = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      const rows = sortedGirls.map((r, i) => {
        return `<tr>
          <td>${i + 1}</td>
          <td>${esc(r.name)}</td>
          <td style="color:green;font-weight:700">${r.totalPresent}</td>
          <td style="color:red;font-weight:700">${r.totalAbsent}</td>
        </tr>`;
      }).join('');

      html = `<!DOCTYPE html><html lang="tr" dir="ltr">
        <head><meta charset="UTF-8"><title>${monthName} Ayi Raporu</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
        <style>body{font-family:Poppins,sans-serif;direction:ltr;padding:20px}
        h1{color:#1B3A5C;border-bottom:2px solid #C8102E;padding-bottom:10px}
        .summary{display:flex;gap:20px;margin:15px 0;flex-wrap:wrap}
        .sum-box{background:#f0f2f8;border-radius:10px;padding:12px 20px;text-align:center}
        .sum-box b{font-size:24px;color:#1B3A5C}
        .sum-box span{font-size:13px;color:#6b7a99}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ddd;padding:8px;text-align:center;font-size:13px}
        th{background:#1B3A5C;color:white}
        .footer{margin-top:20px;font-size:12px;color:#6b7a99;border-top:1px solid #e2e8f0;padding-top:10px}
        @media print{body{padding:10px}}
        </style></head><body>
        <h1>${monthName} Ayi Devam Raporu</h1>
        <p style="color:#6b7a99;font-size:14px">Donem: ${exportStart} - ${exportEnd}</p>
        <div class="summary">
          <div class="sum-box"><b>${activeGirls.length}</b><br><span>Calisan Sayisi</span></div>
          <div class="sum-box"><b>${totalPresent}</b><br><span>Toplam Devam</span></div>
          <div class="sum-box"><b>${totalAbsent}</b><br><span>Toplam Devamsizlik</span></div>
          <div class="sum-box"><b>${sortedGirls.length}</b><br><span>Katilimci Calisan</span></div>
        </div>
        <table>
          <tr><th>#</th><th>Ad Soyad</th><th>Toplam Devam</th><th>Toplam Devamsizlik</th></tr>
          ${rows}
        </table>
        <div class="footer">Aktarim tarihi: ${new Date().toLocaleDateString('tr-TR')} | Yoklama Sistemi</div>
        </body></html>`;

    } else {
      const dayName = DAY_NAMES[new Date(exportDate + 'T00:00:00').getDay()] || '';

      const sortedGirls = state.girls.filter(g => !g.isDeleted).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      const rows = sortedGirls.map((g, i) => {
        const key = `${g.id}_${exportDate}_Genel`;
        const rec = state.attendanceData[key];
        const statusCell = rec
          ? (rec.status === 'Var' ? '<td style="color:green;font-weight:700;font-size:16px">\u2713</td>' : '<td style="color:red;font-weight:700;font-size:16px">\u2717</td>')
          : '<td style="color:#ccc">\u2014</td>';
        return `<tr>
          <td>${i + 1}</td>
          <td>${esc(g.name)}</td>
          ${statusCell}
        </tr>`;
      }).join('');

      html = `<!DOCTYPE html><html lang="tr" dir="ltr">
        <head><meta charset="UTF-8"><title>${exportDate} Gunu Raporu</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
        <style>body{font-family:Poppins,sans-serif;direction:ltr;padding:20px}
        h1{color:#1B3A5C;border-bottom:2px solid #C8102E;padding-bottom:10px}
        .summary{display:flex;gap:20px;margin:15px 0;flex-wrap:wrap}
        .sum-box{background:#f0f2f8;border-radius:10px;padding:12px 20px;text-align:center}
        .sum-box b{font-size:24px;color:#1B3A5C}
        .sum-box span{font-size:13px;color:#6b7a99}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ddd;padding:10px;text-align:center;font-size:14px}
        th{background:#1B3A5C;color:white}
        .footer{margin-top:20px;font-size:12px;color:#6b7a99;border-top:1px solid #e2e8f0;padding-top:10px}
        @media print{body{padding:10px}}
        </style></head><body>
        <h1>${exportDate} Gunu Devam Raporu</h1>
        <p style="color:#6b7a99;font-size:14px">Gun: ${dayName}</p>
        <div class="summary">
          <div class="sum-box"><b>${activeGirls.length}</b><br><span>Calisan Sayisi</span></div>
          <div class="sum-box"><b>${totalPresent}</b><br><span>Var</span></div>
          <div class="sum-box"><b>${totalAbsent}</b><br><span>Yok</span></div>
        </div>
        <table>
          <tr><th>#</th><th>Ad Soyad</th><th>Durum</th></tr>
          ${rows}
        </table>
        <div class="footer">Aktarim tarihi: ${new Date().toLocaleDateString('tr-TR')} | Yoklama Sistemi</div>
        </body></html>`;
    }

    const w = window.open('', '_blank');
    if (!w) { showToast('Pencere tarayici tarafindan engellendi', 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.print();
  });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// MODAL YARDIMCILARI
// ============================================================
function openModal(id) {
  if (!DOM[id]) return;
  DOM[id].classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  if (!DOM[id]) return;
  DOM[id].classList.remove('show');
  const anyOpen = document.querySelector('.modal-overlay.show');
  if (!anyOpen) document.body.style.overflow = '';
}

// ============================================================
// ONAY MODAL
// ============================================================
let confirmResolve = null;

function showConfirm({ icon = '&#9888;', title, msg, okLabel = 'Onayla', okClass = '', onOk }) {
  if (DOM.confirmIcon) DOM.confirmIcon.innerHTML = icon;
  if (DOM.confirmTitle) DOM.confirmTitle.textContent = title;
  if (DOM.confirmMsg) DOM.confirmMsg.textContent = msg;
  const okBtn = DOM.confirmOk;
  if (okBtn) {
    okBtn.textContent = okLabel;
    okBtn.className = 'confirm-ok';
    if (okClass) okBtn.classList.add(...okClass.split(' ').filter(Boolean));
  }
  confirmResolve = onOk;
  if (DOM.confirmOverlay) DOM.confirmOverlay.classList.add('show');
}

if (DOM.confirmOk) {
  DOM.confirmOk.addEventListener('click', async () => {
    if (DOM.confirmOverlay) DOM.confirmOverlay.classList.remove('show');
    if (confirmResolve) {
      const fn = confirmResolve;
      confirmResolve = null;
      try { await fn(); } catch (e) { console.error('Onay hatasi:', e); }
    }
  });
}

if (DOM.confirmCancel) {
  DOM.confirmCancel.addEventListener('click', () => {
    if (DOM.confirmOverlay) DOM.confirmOverlay.classList.remove('show');
    confirmResolve = null;
  });
}

if (DOM.confirmOverlay) {
  DOM.confirmOverlay.addEventListener('click', e => {
    if (e.target === DOM.confirmOverlay) {
      DOM.confirmOverlay.classList.remove('show');
      confirmResolve = null;
    }
  });
}

if (DOM.closeGirlModal) DOM.closeGirlModal.addEventListener('click', () => closeModal('girlModal'));
if (DOM.cancelGirlModal) DOM.cancelGirlModal.addEventListener('click', () => closeModal('girlModal'));
if (DOM.closeAttendanceModal) DOM.closeAttendanceModal.addEventListener('click', () => closeModal('attendanceModal'));
if (DOM.cancelAttendanceModal) DOM.cancelAttendanceModal.addEventListener('click', () => closeModal('attendanceModal'));

$$('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal(overlay.id);
}));

// ============================================================
// OLAY TEMSILCILIGI
// ============================================================
function setupDelegation() {
  if (DOM.needsFollowup) {
    DOM.needsFollowup.addEventListener('click', e => {
      const item = e.target.closest('.followup-item');
      if (item) showGirlProfile(item.dataset.girlId);
    });
  }

  if (DOM.girlsList) {
    DOM.girlsList.addEventListener('click', e => {
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) { e.stopPropagation(); editGirl(editBtn.dataset.girlId); return; }
      const card = e.target.closest('.girl-card');
      if (card) showGirlProfile(card.dataset.girlId);
    });
  }

  if (DOM.searchResults) {
    DOM.searchResults.addEventListener('click', e => {
      const item = e.target.closest('.search-item');
      if (item && item.dataset.girlId) showGirlProfile(item.dataset.girlId);
    });
  }

  if (DOM.attendanceList) {
    DOM.attendanceList.addEventListener('click', e => {
      const delBtn = e.target.closest('.att-delete-btn');
      if (delBtn) {
        e.stopPropagation();
        e.preventDefault();
        deleteAttendanceRecord(delBtn.dataset.attKey);
        return;
      }
      if (state.isLongPress) {
        state.isLongPress = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const item = e.target.closest('.att-item');
      if (item) {
        const g = state.girls.find(x => x.id === item.dataset.girlId);
        if (g && DOM.attendanceDate) toggleAttendanceStatus(g.id, g.name, DOM.attendanceDate.value);
      }
    });

    DOM.attendanceList.addEventListener('mousedown', e => {
      const item = e.target.closest('.att-item');
      if (!item) return;
      state.isLongPress = false;
      state.longPressTimer = setTimeout(() => {
        state.isLongPress = true;
        const g = state.girls.find(x => x.id === item.dataset.girlId);
        if (g && DOM.attendanceDate) openAttendanceEntry(g.id, g.name, DOM.attendanceDate.value);
      }, 500);
    });
    DOM.attendanceList.addEventListener('mouseup', () => {
      if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
      setTimeout(() => { state.isLongPress = false; }, 100);
    });
    DOM.attendanceList.addEventListener('mouseleave', () => {
      if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
    });

    DOM.attendanceList.addEventListener('touchstart', e => {
      const item = e.target.closest('.att-item');
      if (!item) return;
      state.isLongPress = false;
      state.longPressTimer = setTimeout(() => {
        state.isLongPress = true;
        const g = state.girls.find(x => x.id === item.dataset.girlId);
        if (g && DOM.attendanceDate) openAttendanceEntry(g.id, g.name, DOM.attendanceDate.value);
      }, 500);
    }, { passive: true });
    DOM.attendanceList.addEventListener('touchend', () => {
      if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
      setTimeout(() => { state.isLongPress = false; }, 100);
    });
    DOM.attendanceList.addEventListener('touchcancel', () => {
      if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
    });
  }

  if (DOM.calendarGrid) {
    DOM.calendarGrid.addEventListener('click', e => {
      const day = e.target.closest('.cal-day');
      if (day && !day.classList.contains('empty')) showDayDetail(day.dataset.date);
    });
  }
}

// Calisan arama
const girlsSearchInput = document.getElementById('girlsSearch');
if (girlsSearchInput) {
  let girlsSearchTimer = null;
  girlsSearchInput.addEventListener('input', () => {
    clearTimeout(girlsSearchTimer);
    girlsSearchTimer = setTimeout(() => {
      state.girlsSearchQuery = girlsSearchInput.value;
      renderGirlsList();
    }, 250);
  });
}

setupDelegation();

// ============================================================
// BASLATMA
// ============================================================
async function bootstrap() {
  initDarkMode();

  // IndexedDB'yi ilk olarak baslat (Firebase olmadan bile)
  try {
    await IDB.init();
    state.idb = true;
  } catch (e) {
    console.warn('IndexedDB baslatma hatasi:', e);
    state.idb = false;
  }

  // Cevrimdisi senkronizasyon kuyrugunu baslat
  try {
    await OfflineQueue.init();
  } catch (e) {
    console.warn('OfflineQueue baslatma hatasi:', e);
  }

  // Zaman dilimi arayuzunu baslat
  initTimestampToggle();

  // Cevrimici durumunu ayarla
  updateOnlineStatus();

  // Firebase modullerini baslat
  const modulesReady = await initModules();

  if (modulesReady) {
    await initAuth();
    OfflineQueue.trySync();
  } else {
    console.error('Firebase yuklenemedi');
    hideSplash();
    showLogin();
  }

  // Global hook for inline script to trigger app init after manual sign-in
  window._triggerAppInit = async function(user) {
    console.log('_triggerAppInit called with user:', user?.email);
    state.currentUser = user;
    showApp(user);
    if (!state.appInitialized) {
      state.appInitialized = true;
      await loadData();
      renderPage();
    }
  };
}

bootstrap();
