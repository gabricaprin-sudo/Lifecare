// ============================================================
// NOTIFICATION SYSTEM — Enhanced Design & Dashboard Compatible
// Displays notifications from Firestore 'notifications' collection
// Works with both Dashboard and Main App
// ============================================================

// NOTE: For the main app (index), Firebase is initialized externally.
// For the dashboard, this module imports Firebase directly.
const NotificationSystem = {
  container: null,
  currentNotif: null,
  unsub: null,
  dismissedNotifs: new Set(),
  db: null,
  firebaseReady: false,
  _initialized: false,

  init(dbInstance) {
    if (this._initialized) {
      console.log('NotificationSystem already initialized');
      return;
    }
    this._initialized = true;
    this.db = dbInstance;
    this.firebaseReady = !!dbInstance;

    // Load dismissed notifications from localStorage
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
      dismissed.forEach(id => this.dismissedNotifs.add(id));
    } catch (e) { console.warn('Failed to load dismissed notifications:', e); }

    // Create notification container with enhanced styling
    this.container = document.createElement('div');
    this.container.id = 'notificationBanner';
    this.container.style.cssText = `
      position: fixed;
      top: calc(76px + env(safe-area-inset-top, 0px));
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 480px;
      z-index: 1000;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
    `;
    document.body.appendChild(this.container);

    // Add enhanced animation styles
    if (!document.getElementById('notifAnimStyles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'notifAnimStyles';
      styleEl.textContent = `
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-30px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-30px) scale(0.92); }
        }
        @keyframes notifPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
          50% { box-shadow: 0 8px 40px rgba(0,0,0,0.35); }
        }
        @keyframes notifIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        #notif-banner-inner {
          animation: notifSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                     notifPulse 3s ease-in-out infinite 0.5s;
        }
        #notif-banner-inner.notif-closing {
          animation: notifSlideOut 0.3s ease forwards !important;
        }
        .notif-icon-animated {
          animation: notifIconPulse 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Listen for notifications
    this.listenForNotifications();
    console.log('✅ NotificationSystem initialized');
  },

  listenForNotifications() {
    if (!this.firebaseReady || !this.db) {
      console.warn('Firebase not ready, retrying notifications in 3s...');
      setTimeout(() => this.listenForNotifications(), 3000);
      return;
    }

    // Dynamic import for Firestore functions if needed
    this._setupListener();
  },

  async _setupListener() {
    try {
      // Try to use the already imported functions from the module scope
      // If that fails (in main app context), dynamically import
      let collectionFn, queryFn, whereFn, orderByFn, onSnapshotFn;

      if (typeof getFirestore !== 'undefined') {
        // We're in a module context where Firestore is imported
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        collectionFn = firestoreModule.collection;
        queryFn = firestoreModule.query;
        whereFn = firestoreModule.where;
        orderByFn = firestoreModule.orderBy;
        onSnapshotFn = firestoreModule.onSnapshot;
      } else {
        // Dynamic import
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        collectionFn = firestoreModule.collection;
        queryFn = firestoreModule.query;
        whereFn = firestoreModule.where;
        orderByFn = firestoreModule.orderBy;
        onSnapshotFn = firestoreModule.onSnapshot;
      }

      const q = queryFn(
        collectionFn(this.db, 'notifications'),
        whereFn('active', '==', true),
        orderByFn('createdAt', 'desc')
      );

      this.unsub = onSnapshotFn(q, (snap) => {
        const notifs = [];
        snap.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));

        // Filter out dismissed notifications
        const activeNotifs = notifs.filter(n => !this.dismissedNotifs.has(n.id));

        if (activeNotifs.length > 0) {
          // Show the most recent active notification
          this.showNotification(activeNotifs[0]);
        } else {
          this.hideNotification();
        }
      }, err => {
        console.error('Notification listener error:', err);
      });
    } catch (e) {
      console.error('Failed to init notification listener:', e);
      // Retry after delay
      setTimeout(() => this._setupListener(), 5000);
    }
  },

  showNotification(notif) {
    if (this.currentNotif === notif.id) return;
    this.currentNotif = notif.id;

    const typeConfig = {
      info: {
        bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        icon: '&#128161;',
        borderColor: '#3498db',
        iconBg: 'rgba(255,255,255,0.2)'
      },
      success: {
        bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
        icon: '&#9989;',
        borderColor: '#2ecc71',
        iconBg: 'rgba(255,255,255,0.2)'
      },
      warning: {
        bg: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)',
        icon: '&#9888;',
        borderColor: '#f39c12',
        iconBg: 'rgba(255,255,255,0.2)'
      },
      error: {
        bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        icon: '&#10060;',
        borderColor: '#e74c3c',
        iconBg: 'rgba(255,255,255,0.2)'
      },
      feature: {
        bg: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
        icon: '&#127881;',
        borderColor: '#9b59b6',
        iconBg: 'rgba(255,255,255,0.2)'
      }
    };

    const style = typeConfig[notif.type] || typeConfig.info;

    const dismissBtn = notif.dismissible ?
      `<button id="notif-dismiss-btn" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s;
        pointer-events: all;
        backdrop-filter: blur(4px);
      " onmouseover="this.style.background='rgba(255,255,255,0.35)'; this.style.transform='scale(1.1)'"
         onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)'">&#10005;</button>` : '';

    const link = notif.link ?
      `<a href="${this.esc(notif.link)}" target="_blank" style="
        color: rgba(255,255,255,0.95);
        text-decoration: none;
        font-size: 13px;
        margin-top: 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        pointer-events: all;
        font-weight: 600;
        background: rgba(255,255,255,0.15);
        padding: 6px 14px;
        border-radius: 20px;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        المزيد &#10132;
      </a>` : '';

    // Build enhanced notification HTML
    this.container.innerHTML = `
      <div id="notif-banner-inner" style="
        background: ${style.bg};
        color: white;
        border-radius: 18px;
        padding: 18px 22px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        display: flex;
        align-items: flex-start;
        gap: 16px;
        pointer-events: all;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid ${style.borderColor};
        position: relative;
        overflow: hidden;
      ">
        <!-- Decorative glow -->
        <div style="
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          pointer-events: none;
        "></div>

        <!-- Icon -->
        <div class="notif-icon-animated" style="
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: ${style.iconBg};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.15);
        ">${style.icon}</div>

        <!-- Content -->
        <div style="flex: 1; min-width: 0; position: relative; z-index: 1;">
          <div style="
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 6px;
            line-height: 1.4;
            letter-spacing: -0.2px;
          ">${this.esc(notif.title)}</div>
          <div style="
            font-size: 13px;
            opacity: 0.92;
            line-height: 1.6;
            font-weight: 500;
          ">${this.esc(notif.body)}</div>
          ${link}
        </div>

        <!-- Dismiss button -->
        ${dismissBtn}
      </div>
    `;

    // Attach dismiss handler
    if (notif.dismissible) {
      const dismissBtnEl = document.getElementById('notif-dismiss-btn');
      if (dismissBtnEl) {
        dismissBtnEl.addEventListener('click', () => this.dismiss(notif.id));
      }
    }

    // Auto-hide non-dismissible notifications after 10 seconds
    if (!notif.dismissible) {
      setTimeout(() => {
        this.hideNotification();
      }, 10000);
    }
  },

  hideNotification() {
    this.currentNotif = null;
    if (this.container) {
      this.container.innerHTML = '';
    }
  },

  dismiss(id) {
    // Mark as dismissed in localStorage
    this.dismissedNotifs.add(id);
    try {
      const dismissed = Array.from(this.dismissedNotifs);
      localStorage.setItem('dismissedNotifs', JSON.stringify(dismissed));
    } catch (e) { console.warn('Failed to save dismissed notification:', e); }

    // Animate out
    const banner = document.getElementById('notif-banner-inner');
    if (banner) {
      banner.classList.add('notif-closing');
      setTimeout(() => this.hideNotification(), 300);
    }
  },

  // Reset dismissed notifications (useful for testing)
  resetDismissed() {
    this.dismissedNotifs.clear();
    try {
      localStorage.removeItem('dismissedNotifs');
    } catch (e) {}
    console.log('Dismissed notifications reset');
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  destroy() {
    if (this.unsub) this.unsub();
    if (this.container) this.container.remove();
    this._initialized = false;
    this.currentNotif = null;
  }
};

export { NotificationSystem };
