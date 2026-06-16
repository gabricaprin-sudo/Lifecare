// ============================================================
// Admin Panel — Notification Management Dashboard
// Firebase Firestore integration for sending notifications
// ============================================================

// ============================================================
// CONFIG — Edit this list to add/remove admins
// ============================================================
const ALLOWED_ADMINS = [
  // Add admin emails here, for example:
  // 'admin@example.com',
  // 'manager@church.org',
];

// Same Firebase config as the main app
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB2cycBTKMjVg8S_fBYN8C-hwUk5FUF81Q",
  authDomain: "kenesa-e5efd.firebaseapp.com",
  projectId: "kenesa-e5efd",
  storageBucket: "kenesa-e5efd.firebasestorage.app",
  messagingSenderId: "227273753184",
  appId: "1:227273753184:web:ecdf258142ad55ed5cf905",
  measurementId: "G-6HS8KNW1GZ"
};

// ============================================================
// MODULE IMPORTS
// ============================================================
let firebaseApp, auth, db, provider;
let firebaseReady = false;
let notificationsUnsub = null;

// DOM Cache
const $ = (id) => document.getElementById(id);

// ============================================================
// TOAST
// ============================================================
let toastTimeout;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimeout);
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  toastTimeout = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs, writeBatch } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    firebaseApp = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    provider = new GoogleAuthProvider();
    firebaseReady = true;

    // Expose Firestore functions
    window._fb = {
      collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot,
      serverTimestamp, where, getDocs, writeBatch
    };

    // Check redirect result first
    try {
      await getRedirectResult(auth);
    } catch (e) {
      console.error('Redirect result error:', e);
    }

    // Listen for auth state
    onAuthStateChanged(auth, handleAuthState);

  } catch (e) {
    console.error('Firebase init error:', e);
    showToast('فشل في تهيئة Firebase — تحقق من الاتصال', 'error');
  }
}

// ============================================================
// AUTH STATE HANDLER
// ============================================================
function handleAuthState(user) {
  if (!user) {
    showLoginScreen();
    return;
  }

  // Check if user is authorized
  if (!isAdmin(user.email)) {
    showUnauthorizedScreen(user.email);
    return;
  }

  // User is authorized — show admin panel
  showAdminPanel(user);
}

function isAdmin(email) {
  if (!email) return false;
  // If ALLOWED_ADMINS is empty, allow any signed-in user (for initial setup)
  if (ALLOWED_ADMINS.length === 0) return true;
  return ALLOWED_ADMINS.includes(email.toLowerCase().trim());
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================
function showLoginScreen() {
  $('loginScreen').classList.remove('hidden');
  $('unauthorizedScreen').classList.add('hidden');
  $('adminPanel').classList.add('hidden');
  cleanupListeners();
}

function showUnauthorizedScreen(email) {
  $('loginScreen').classList.add('hidden');
  $('unauthorizedScreen').classList.remove('hidden');
  $('adminPanel').classList.add('hidden');
  $('unauthorizedEmail').textContent = email || '';
  cleanupListeners();
}

function showAdminPanel(user) {
  $('loginScreen').classList.add('hidden');
  $('unauthorizedScreen').classList.add('hidden');
  $('adminPanel').classList.remove('hidden');

  // Update user info
  $('userEmail').textContent = user.email || '';

  // Start listening for notifications
  listenForNotifications();

  // Render admins list
  renderAdminsList();
}

function cleanupListeners() {
  if (notificationsUnsub) {
    notificationsUnsub();
    notificationsUnsub = null;
  }
}

// ============================================================
// GOOGLE SIGN IN
// ============================================================
$('googleSignIn').addEventListener('click', async () => {
  if (!firebaseReady) {
    showToast('Firebase غير جاهز — تحقق من الاتصال', 'error');
    return;
  }

  $('googleSignIn').classList.add('is-loading');
  try {
    await window._fb.signInWithPopup(auth, provider);
  } catch (e) {
    $('googleSignIn').classList.remove('is-loading');
    if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) {
      try {
        await window._fb.signInWithRedirect(auth, provider);
      } catch (e2) {
        showToast('فشل تسجيل الدخول', 'error');
      }
    } else {
      showToast('فشل تسجيل الدخول: ' + e.message, 'error');
    }
  }
});

// Switch account (for unauthorized screen)
$('switchAccount').addEventListener('click', async () => {
  if (!firebaseReady) return;
  await window._fb.signOut(auth);
  // After sign out, the onAuthStateChanged will trigger and show login screen
});

// Sign out from admin panel
$('signOutBtn').addEventListener('click', async () => {
  if (!firebaseReady) return;
  await window._fb.signOut(auth);
});

// ============================================================
// NOTIFICATION PUBLISHING
// ============================================================
const notifBody = $('notifBody');
const notifTitle = $('notifTitle');
const charCount = $('charCount');

// Character counter
notifBody.addEventListener('input', () => {
  const len = notifBody.value.length;
  charCount.textContent = `${len} / 500`;
  if (len > 500) {
    charCount.style.color = 'var(--red)';
    notifBody.style.borderColor = 'var(--red)';
  } else {
    charCount.style.color = 'var(--text-muted)';
    notifBody.style.borderColor = '';
  }
});

// Publish button
$('publishBtn').addEventListener('click', async () => {
  if (!firebaseReady) {
    showToast('Firebase غير متاح', 'error');
    return;
  }

  const title = notifTitle.value.trim();
  const body = notifBody.value.trim();

  if (!body) {
    showToast('الرجاء كتابة نص الإشعار', 'warning');
    notifBody.focus();
    return;
  }

  if (body.length > 500) {
    showToast('نص الإشعار طويل جداً (الحد الأقصى 500 حرف)', 'warning');
    return;
  }

  // Get selected target grade
  const targetGradeEl = document.querySelector('input[name="targetGrade"]:checked');
  const targetGrade = targetGradeEl ? targetGradeEl.value : '';

  // Get selected type
  const typeEl = document.querySelector('input[name="notifType"]:checked');
  const notifType = typeEl ? typeEl.value : 'info';

  // Show loading state
  const publishBtn = $('publishBtn');
  publishBtn.classList.add('is-loading');

  try {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const notifData = {
      id,
      title: title || '',
      body,
      targetGrade,
      type: notifType,
      createdAt: Date.now(),
      createdBy: auth.currentUser?.displayName || 'مشرف',
      createdByEmail: auth.currentUser?.email || '',
      // Set expiry to 7 days from now
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    };

    await window._fb.setDoc(window._fb.doc(db, 'notifications', id), notifData);

    // Clear form
    notifTitle.value = '';
    notifBody.value = '';
    charCount.textContent = '0 / 500';
    charCount.style.color = 'var(--text-muted)';
    notifBody.style.borderColor = '';

    showToast('تم نشر الإشعار بنجاح!', 'success');

  } catch (e) {
    console.error('Publish error:', e);
    showToast('فشل في نشر الإشعار: ' + e.message, 'error');
  } finally {
    publishBtn.classList.remove('is-loading');
  }
});

// ============================================================
// NOTIFICATIONS LISTENER
// ============================================================
function listenForNotifications() {
  if (!firebaseReady || notificationsUnsub) return;

  const q = window._fb.query(
    window._fb.collection(db, 'notifications'),
    window._fb.orderBy('createdAt', 'desc')
  );

  notificationsUnsub = window._fb.onSnapshot(q, (snap) => {
    const list = $('notificationsList');
    if (!list) return;

    if (snap.empty) {
      list.innerHTML = '<div class="empty-state">لا توجد إشعارات منشورة بعد</div>';
      $('notifCount').textContent = '0';
      return;
    }

    let html = '';
    const now = Date.now();
    const activeCount = snap.docs.filter(d => {
      const data = d.data();
      return !data.expiresAt || data.expiresAt > now;
    }).length;

    snap.docs.forEach(docSnap => {
      const n = docSnap.data();
      const isExpired = n.expiresAt && n.expiresAt < now;
      const dateStr = n.createdAt
        ? new Date(n.createdAt).toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '-';

      const typeIcons = {
        info: '&#128161;',
        warning: '&#9888;',
        success: '&#10003;',
        error: '&#10007;'
      };

      const targetLabel = n.targetGrade || 'الجميع';

      html += `
        <div class="notif-item ${esc(n.type || 'info')}" data-id="${esc(n.id)}">
          <span class="notif-icon">${typeIcons[n.type] || '&#128161;'}</span>
          <div class="notif-content">
            ${n.title ? `<div class="notif-title">${esc(n.title)}</div>` : ''}
            <div class="notif-body">${esc(n.body)}</div>
            <div class="notif-meta">
              <span class="notif-date">${esc(dateStr)}${isExpired ? ' (منتهي)' : ''}</span>
              <span class="notif-target">${esc(targetLabel)}</span>
            </div>
          </div>
          <button class="notif-delete" data-id="${esc(n.id)}" title="حذف الإشعار">&#128465;</button>
        </div>
      `;
    });

    list.innerHTML = html;
    $('notifCount').textContent = String(activeCount);

    // Attach delete handlers
    list.querySelectorAll('.notif-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNotification(btn.dataset.id);
      });
    });
  }, (err) => {
    console.error('Notifications listener error:', err);
    $('notificationsList').innerHTML = '<div class="empty-state">خطأ في تحميل الإشعارات</div>';
  });
}

// ============================================================
// DELETE NOTIFICATION
// ============================================================
async function deleteNotification(id) {
  if (!firebaseReady || !id) return;

  if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;

  try {
    await window._fb.deleteDoc(window._fb.doc(db, 'notifications', id));
    showToast('تم حذف الإشعار', 'success');
  } catch (e) {
    console.error('Delete error:', e);
    showToast('فشل في حذف الإشعار', 'error');
  }
}

// ============================================================
// ADMINS LIST
// ============================================================
function renderAdminsList() {
  const list = $('adminsList');
  if (!list) return;

  if (ALLOWED_ADMINS.length === 0) {
    list.innerHTML = `
      <div class="admin-item">
        <span>&#9888;</span>
        <span class="admin-email">أي مستخدم مسجل الدخول (الوضع المفتوح)</span>
        <span class="admin-role owner">مفتوح</span>
      </div>
    `;
    return;
  }

  list.innerHTML = ALLOWED_ADMINS.map((email, i) => `
    <div class="admin-item">
      <span>&#128100;</span>
      <span class="admin-email">${esc(email)}</span>
      <span class="admin-role ${i === 0 ? 'owner' : 'admin'}">${i === 0 ? 'مالك' : 'مشرف'}</span>
    </div>
  `).join('');
}

// ============================================================
// UTILITY
// ============================================================
function esc(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ============================================================
// START
// ============================================================
init();
