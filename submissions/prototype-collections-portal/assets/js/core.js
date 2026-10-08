/*
 * core.js: Clock, Store, Auth, Fmt, Validate (no dependencies except PAGES for Auth.can/homeFor).
 *
 * ---------------------------------------------------------------------------
 * STATE LAYOUT (localStorage['cpp.state.v1'], JSON)
 *   { meta:        { clockOffsetDays, seeded },
 *     config:      { roles, users, outcomeCodes, contactMethods, nextActions, fieldAccess, settings, ...any other SEED_CONFIG key },
 *     collections: { <name>: [ ...items ], migration: {...} } }
 * Only the Store API should touch this structure.
 *
 * COLLECTIONS (Store.get(name) returns the live array; Store.insert/update/save persist)
 *   customers       from SEED_CUSTOMERS (array). Own ids (e.g. 'C-1001'); insert keeps a supplied id.
 *   templates       from SEED_CONFIG.templates. Mutable. Insert prefix TPL.
 *   payments PAY, promises PRM, logs LOG, followups FU, audit AUD, verifications VER,
 *   messages MSG, jobRuns JOB, alerts ALT, settlements SET, reminderSchedule RSC,
 *   queries QRY, reversals REV, accountViews VIEW, accessAttempts ACC, apiRequests API
 *                   from the SEED_ACTIVITY key of the same name (arrays). All exist (empty) even if not seeded.
 *   migration       OBJECT, not an array: Store.get('migration') returns it as stored.
 *                   Defaults to { legacyTotal:0, migrated:0, exceptions:[] } if not seeded.
 *   Any extra array key in SEED_ACTIVITY also becomes a collection (ids default to <NAME>-n).
 *   Seeded array items without an id get one (PREFIX-n); seeded ids are kept.
 *
 * READ-ONLY CONFIG (not collections; insert/update throw)
 *   Store.get('users') / Store.get('roles')  -> arrays (copies)
 *   Store.settings()                         -> the settings object { key: {value, tbd?, min?, max?, demo?} }
 *   Store.config('outcomeCodes' | 'contactMethods' | 'nextActions' | 'fieldAccess' | ...) -> stored value or null
 *   roles[].home may be a page id ('staff-search', 'report-audit-trail') or a file name; Auth.homeFor resolves it to a file.
 *
 * SESSION (sessionStorage, values JSON-encoded; Store.session.get('role') maps to key 'cpp.role')
 *   role, user, verified (customer id string), phoneVerified ({customerId:true}), storyTags (bool)
 *
 * Conventions: dates 'YYYY-MM-DD', datetimes 'YYYY-MM-DDTHH:mm', money in pounds.
 * Seed strings matching ^[+-]?\d+d(@HH:MM)?$ are resolved against Clock.today() on first load only.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var STATE_KEY = 'cpp.state.v1';
  var SESSION_PREFIX = 'cpp.';
  var RELATIVE_DATE = /^([+-]?\d+)d(?:@(\d{2}:\d{2}))?$/;

  var ID_PREFIX = {
    customers: 'C', templates: 'TPL', payments: 'PAY', promises: 'PRM', logs: 'LOG', followups: 'FU',
    audit: 'AUD', verifications: 'VER', messages: 'MSG', jobRuns: 'JOB', alerts: 'ALT', settlements: 'SET',
    reminderSchedule: 'RSC', queries: 'QRY', reversals: 'REV', accountViews: 'VIEW', accessAttempts: 'ACC',
    apiRequests: 'API'
  };
  var ARRAY_COLLECTIONS = Object.keys(ID_PREFIX);
  var READONLY_CONFIG = ['users', 'roles'];

  // Used only when SEED_CONFIG.roles is missing, so pages still open before seed data exists.
  var DEFAULT_ROLES = [
    { id: 'customer', label: 'Customer', home: 'portal-verify' },
    { id: 'rep', label: 'Collections rep', home: 'staff-search' },
    { id: 'leader', label: 'Team leader', home: 'staff-search' },
    { id: 'finance', label: 'Finance', home: 'report-balances-arrears' },
    { id: 'compliance', label: 'Compliance', home: 'report-audit-trail' },
    { id: 'it', label: 'IT', home: 'report-security-status' }
  ];

  // ---------- storage wrappers (fall back to memory if the browser blocks storage) ----------

  // Wraps localStorage/sessionStorage with a memory fallback.
  function makeStorage(kind) {
    var mem = {};
    var real = null;
    try {
      real = window[kind];
      real.setItem('__cpp_probe__', '1');
      real.removeItem('__cpp_probe__');
    } catch (e) {
      real = null;
    }
    return {
      persistent: !!real,
      get: function (k) {
        if (real) { return real.getItem(k); }
        return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
      },
      set: function (k, v) {
        if (real) { try { real.setItem(k, v); } catch (e) { mem[k] = v; } } else { mem[k] = v; }
      },
      remove: function (k) {
        if (real) { real.removeItem(k); }
        delete mem[k];
      },
      keys: function () {
        var out = Object.keys(mem);
        if (real) { for (var i = 0; i < real.length; i++) { out.push(real.key(i)); } }
        return out;
      }
    };
  }

  var localStore = makeStorage('localStorage');
  var sessionStore = makeStorage('sessionStorage');
  var state = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---------- Clock ----------

  function isoFromUtc(d) {
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  // Returns UTC milliseconds of the date part of an ISO string, or null.
  function utcMs(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  }

  var Clock = {
    // Demo date (real date plus the offset set by "Advance day").
    today: function () {
      var real = new Date();
      var iso = real.getFullYear() + '-' + pad(real.getMonth() + 1) + '-' + pad(real.getDate());
      return Clock.addDays(iso, Clock.offset());
    },
    // Demo date with the real time of day.
    now: function () {
      var real = new Date();
      return Clock.today() + 'T' + pad(real.getHours()) + ':' + pad(real.getMinutes());
    },
    // Adds n days to a date or datetime string, keeping any time suffix.
    addDays: function (iso, n) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(String(iso || ''));
      if (!m) { return iso; }
      return isoFromUtc(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + Number(n || 0)))) + m[4];
    },
    // Whole days from fromIso to toIso (positive when toIso is later); null if either is invalid.
    diffDays: function (fromIso, toIso) {
      var a = utcMs(fromIso);
      var b = utcMs(toIso);
      if (a === null || b === null) { return null; }
      return Math.round((b - a) / 86400000);
    },
    // Moves the demo clock forward (default one day) and persists it.
    advance: function (days) {
      Store.init();
      state.meta.clockOffsetDays = Clock.offset() + (days === undefined ? 1 : Number(days));
      Store.save();
    },
    // Days the demo clock is ahead of the real date.
    offset: function () {
      if (!state) { Store.init(); }
      return state.meta.clockOffsetDays || 0;
    }
  };

  // ---------- Store ----------

  // Walks seed data, returning a deep copy with relative-date strings resolved.
  function resolveValue(v) {
    if (typeof v === 'string') {
      var m = RELATIVE_DATE.exec(v);
      if (!m) { return v; }
      var date = Clock.addDays(Clock.today(), parseInt(m[1], 10));
      return m[2] ? date + 'T' + m[2] : date;
    }
    if (Array.isArray(v)) { return v.map(resolveValue); }
    if (v && typeof v === 'object') {
      var out = {};
      Object.keys(v).forEach(function (k) { out[k] = resolveValue(v[k]); });
      return out;
    }
    return v;
  }

  // Next PREFIX-n id: one above the highest numeric suffix already in the collection.
  function nextId(coll) {
    var prefix = ID_PREFIX[coll] || String(coll).toUpperCase();
    var max = 0;
    (state.collections[coll] || []).forEach(function (item) {
      var m = item && typeof item.id === 'string' && /-(\d+)$/.exec(item.id);
      if (m && +m[1] > max) { max = +m[1]; }
    });
    return prefix + '-' + (max + 1);
  }

  // Makes sure every expected key and collection exists.
  function fillMissing() {
    state.meta = state.meta || {};
    if (typeof state.meta.clockOffsetDays !== 'number') { state.meta.clockOffsetDays = 0; }
    state.config = state.config || {};
    state.collections = state.collections || {};
    if (!Array.isArray(state.config.roles) || !state.config.roles.length) {
      state.config.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    }
    ['users', 'outcomeCodes', 'contactMethods', 'nextActions'].forEach(function (k) {
      if (!Array.isArray(state.config[k])) { state.config[k] = []; }
    });
    if (!state.config.fieldAccess) { state.config.fieldAccess = {}; }
    if (!state.config.settings) { state.config.settings = {}; }
    ARRAY_COLLECTIONS.forEach(function (c) {
      if (!Array.isArray(state.collections[c])) { state.collections[c] = []; }
    });
    if (!state.collections.migration || Array.isArray(state.collections.migration)) {
      state.collections.migration = { legacyTotal: 0, migrated: 0, exceptions: [] };
    }
  }

  // Builds a fresh state from the SEED_* globals.
  function buildSeed() {
    var haveConfig = !!(window.SEED_CONFIG && typeof window.SEED_CONFIG === 'object');
    state = { meta: { clockOffsetDays: 0, seeded: haveConfig }, config: {}, collections: {} };

    var cfg = resolveValue(window.SEED_CONFIG || {});
    Object.keys(cfg).forEach(function (k) {
      if (k === 'templates') { state.collections.templates = Array.isArray(cfg[k]) ? cfg[k] : []; } else { state.config[k] = cfg[k]; }
    });
    state.collections.customers = Array.isArray(window.SEED_CUSTOMERS) ? resolveValue(window.SEED_CUSTOMERS) : [];
    var activity = resolveValue(window.SEED_ACTIVITY || {});
    Object.keys(activity).forEach(function (k) { state.collections[k] = activity[k]; });

    fillMissing();
    Object.keys(state.collections).forEach(function (c) {
      var list = state.collections[c];
      if (!Array.isArray(list)) { return; }
      list.forEach(function (item) {
        if (item && typeof item === 'object' && !item.id) { item.id = nextId(c); }
      });
    });
  }

  // Loads state from localStorage, or seeds it on first load (or when an earlier load ran before seed data existed).
  function init() {
    if (state) { return state; }
    var parsed = null;
    var raw = localStore.get(STATE_KEY);
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    var haveSeed = !!window.SEED_CONFIG;
    if (parsed && parsed.meta && !(parsed.meta.seeded === false && haveSeed)) {
      state = parsed;
      fillMissing();
      return state;
    }
    buildSeed();
    save();
    return state;
  }

  // Writes the whole state to localStorage.
  function save() {
    if (!state) { return; }
    try { localStore.set(STATE_KEY, JSON.stringify(state)); } catch (e) { /* storage full: keep working in memory */ }
  }

  function sessionKey(k) {
    return String(k).indexOf(SESSION_PREFIX) === 0 ? String(k) : SESSION_PREFIX + k;
  }

  var Store = {
    init: init,
    save: save,
    // Returns the live array for a collection (or the object for 'migration'); users/roles return array copies.
    get: function (coll) {
      var s = init();
      if (READONLY_CONFIG.indexOf(coll) >= 0) { return (s.config[coll] || []).slice(); }
      if (!s.collections[coll]) { s.collections[coll] = []; }
      return s.collections[coll];
    },
    // Finds one item by id (string) or by predicate function; null if none.
    find: function (coll, idOrFn) {
      var list = Store.get(coll);
      if (!Array.isArray(list)) { return null; }
      for (var i = 0; i < list.length; i++) {
        if (typeof idOrFn === 'function' ? idOrFn(list[i]) : list[i].id === idOrFn) { return list[i]; }
      }
      return null;
    },
    // Returns matching items (all items when fn is omitted) as a new array.
    filter: function (coll, fn) {
      var list = Store.get(coll);
      if (!Array.isArray(list)) { return []; }
      return fn ? list.filter(fn) : list.slice();
    },
    // Adds an item, assigns PREFIX-n (customers keep their own id), saves, and returns the item.
    insert: function (coll, obj) {
      var s = init();
      if (READONLY_CONFIG.indexOf(coll) >= 0 || coll === 'migration') { throw new Error('Collection "' + coll + '" is read-only'); }
      if (!Array.isArray(s.collections[coll])) { s.collections[coll] = []; }
      if (!(coll === 'customers' && obj.id)) { obj.id = nextId(coll); }
      s.collections[coll].push(obj);
      save();
      return obj;
    },
    // Shallow-merges patch into the item with this id, saves, and returns the item (null if not found).
    // Audit entries are append-only: updates to the 'audit' collection are refused.
    update: function (coll, id, patch) {
      if (READONLY_CONFIG.indexOf(coll) >= 0 || coll === 'migration') { throw new Error('Collection "' + coll + '" is read-only'); }
      if (coll === 'audit') { throw new Error('Audit entries are append-only and cannot be changed'); }
      var item = Store.find(coll, id);
      if (!item) { return null; }
      Object.keys(patch || {}).forEach(function (k) { item[k] = patch[k]; });
      save();
      return item;
    },
    // The settings object { key: {value, tbd?, min?, max?, demo?} }.
    settings: function () { return init().config.settings; },
    // Sets settings[key].value and saves (callers are responsible for writing the audit row).
    setSetting: function (key, value) {
      var st = init().config.settings;
      if (!st[key]) { st[key] = {}; }
      st[key].value = value;
      save();
      return st[key];
    },
    // Other seeded config such as outcomeCodes, contactMethods, nextActions, fieldAccess; null if absent.
    config: function (key) {
      var v = init().config[key];
      return v === undefined ? null : v;
    },
    // False when the browser blocked storage and state only lives for this page load.
    persistent: function () { return localStore.persistent; },
    // Clears all demo state and session data, then returns to the landing page.
    reset: function () {
      localStore.remove(STATE_KEY);
      sessionStore.keys().forEach(function (k) {
        if (k.indexOf(SESSION_PREFIX) === 0) { sessionStore.remove(k); }
      });
      state = null;
      window.location.href = 'index.html';
    },
    session: {
      // Reads a JSON-encoded sessionStorage value ('role' maps to 'cpp.role'); null if absent.
      get: function (key) {
        var raw = sessionStore.get(sessionKey(key));
        if (raw === null) { return null; }
        try { return JSON.parse(raw); } catch (e) { return raw; }
      },
      set: function (key, val) { sessionStore.set(sessionKey(key), JSON.stringify(val)); },
      remove: function (key) { sessionStore.remove(sessionKey(key)); }
    }
  };

  // ---------- Auth ----------

  var FALLBACK_HOME = {
    customer: 'portal-verify', rep: 'staff-search', leader: 'staff-search',
    finance: 'report-balances-arrears', compliance: 'report-audit-trail', it: 'report-security-status'
  };

  var Auth = {
    // Current role id; defaults to 'customer'.
    role: function () {
      var r = Store.session.get('role');
      var known = Store.get('roles').some(function (x) { return x.id === r; });
      return r && known ? r : 'customer';
    },
    // Switches role; clears the verified customer and picks that role's first staff user.
    setRole: function (id) {
      var previous = Auth.role();
      Store.session.set('role', id);
      if (previous !== id) {
        Auth.setVerified(null);
        var users = Auth.usersForRole(id);
        if (users.length) { Store.session.set('user', users[0].id); } else { Store.session.remove('user'); }
      }
    },
    // Current staff user object for the role (null for customers).
    user: function () {
      var role = Auth.role();
      var u = Store.find('users', Store.session.get('user'));
      if (u && u.role === role) { return u; }
      return Auth.usersForRole(role)[0] || null;
    },
    setUser: function (id) { Store.session.set('user', id); },
    usersForRole: function (roleId) {
      return Store.get('users').filter(function (u) { return u.role === roleId; });
    },
    // File name (may include a query string) of the role's landing page.
    homeFor: function (roleId) {
      var id = roleId || Auth.role();
      var role = Store.find('roles', id);
      var home = (role && role.home) || FALLBACK_HOME[id] || 'index';
      if (/\.html/.test(home)) { return home; }
      var page = Auth.page(home);
      return page ? page.file : home + '.html';
    },
    // PAGES entry for an id, or null.
    page: function (pageId) {
      for (var i = 0; i < window.PAGES.length; i++) {
        if (window.PAGES[i].id === pageId) { return window.PAGES[i]; }
      }
      return null;
    },
    // True if the role (default: current role) may open the page. The optional roleId is used by access tests.
    can: function (pageId, roleId) {
      var page = Auth.page(pageId);
      return !!page && page.roles.indexOf(roleId || Auth.role()) >= 0;
    },
    // False only when fieldAccess lists the field and the current role is not in the list.
    canSeeField: function (fieldKey) {
      var allowed = (Store.config('fieldAccess') || {})[fieldKey];
      if (!allowed) { return true; }
      return allowed.indexOf(Auth.role()) >= 0;
    },
    // Customer id string of the verified portal session, or null.
    verifiedCustomer: function () { return Store.session.get('verified') || null; },
    setVerified: function (customerId) {
      if (customerId) { Store.session.set('verified', customerId); } else { Store.session.remove('verified'); }
    },
    phoneVerified: function (customerId) {
      var map = Store.session.get('phoneVerified') || {};
      return !!map[customerId];
    },
    setPhoneVerified: function (customerId, value) {
      var map = Store.session.get('phoneVerified') || {};
      if (value) { map[customerId] = true; } else { delete map[customerId]; }
      Store.session.set('phoneVerified', map);
    },
    // Records a denied page view in 'accessAttempts' (written directly: Services is not needed here).
    logAccessAttempt: function (pageId) {
      var u = Auth.user();
      return Store.insert('accessAttempts', {
        at: Clock.now(),
        role: Auth.role(),
        userId: u ? u.id : (Auth.verifiedCustomer() || null),
        pageId: pageId,
        result: 'denied'
      });
    }
  };

  // ---------- Fmt ----------

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DASH = '\u2014';

  var Fmt = {
    // 1234.5 -> "\u00a31,234.50"; blank or invalid -> em dash.
    money: function (n) {
      if (n === null || n === undefined || n === '' || isNaN(Number(n))) { return DASH; }
      var v = Math.round(Number(n) * 100) / 100;
      var parts = Math.abs(v).toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return (v < 0 ? '-' : '') + '\u00a3' + parts[0] + '.' + parts[1];
    },
    // '2026-10-08' -> '08 Oct 2026'.
    date: function (iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
      return m ? m[3] + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : DASH;
    },
    // '2026-10-08T14:05' -> '08 Oct 2026, 14:05' (date only if no time part).
    datetime: function (iso) {
      var d = Fmt.date(iso);
      var t = /T(\d{2}):(\d{2})/.exec(String(iso || ''));
      return t && d !== DASH ? d + ', ' + t[1] + ':' + t[2] : d;
    },
    // Hides all but the last `keep` characters (default 2) with bullets.
    mask: function (str, keep) {
      var s = String(str === null || str === undefined ? '' : str);
      var k = keep === undefined || keep === null ? 2 : keep;
      if (s.length <= k) { return s; }
      return new Array(s.length - k + 1).join('\u2022') + s.slice(s.length - k);
    }
  };

  // ---------- Validate (each returns an error string or null) ----------

  function isBlank(v) { return v === null || v === undefined || String(v).trim() === ''; }

  var Validate = {
    required: function (v) { return isBlank(v) ? 'This field is required.' : null; },
    email: function (v) {
      if (isBlank(v)) { return 'Enter an email address.'; }
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? null : 'Enter a valid email address, for example name@example.com.';
    },
    // 10 to 12 digits, optional leading +; keeps stored values below the 13-digit card-scan threshold.
    phone: function (v) {
      if (isBlank(v)) { return 'Enter a phone number.'; }
      var s = String(v).replace(/[\s\-()]/g, '');
      return /^\+?\d{10,12}$/.test(s) ? null : 'Enter a valid phone number (10 to 12 digits).';
    },
    postcode: function (v) {
      if (isBlank(v)) { return 'Enter a postcode.'; }
      return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(String(v).trim()) ? null : 'Enter a valid UK postcode, for example AB1 2CD.';
    },
    // Plain money: digits, optional pound sign, optional thousands commas in the right places, 1 to 2 decimals; positive; optional {max}.
    amount: function (v, opts) {
      var o = opts || {};
      if (isBlank(v)) { return 'Enter an amount.'; }
      var s = String(v).trim();
      if (!/^\u00a3?\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\u00a3?\d+(\.\d{1,2})?$/.test(s)) {
        if (/^-/.test(s)) { return 'Amount must be greater than zero.'; }
        if (/^\u00a3?[\d,]+\.\d{3,}$/.test(s)) { return 'Use no more than two decimal places.'; }
        return 'Enter the amount as a number, for example 25.00.';
      }
      var n = Number(s.replace(/[\u00a3,]/g, ''));
      if (n <= 0) { return 'Amount must be greater than zero.'; }
      if (o.max !== undefined && o.max !== null && n > o.max + 1e-9) { return 'Amount cannot be more than ' + Fmt.money(o.max) + '.'; }
      return null;
    },
    // Real calendar date 'YYYY-MM-DD', optional {min, max} ISO bounds (inclusive).
    date: function (v, opts) {
      var o = opts || {};
      if (isBlank(v)) { return 'Enter a date.'; }
      var s = String(v).trim();
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (!m) { return 'Enter a valid date.'; }
      var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) { return 'Enter a valid date.'; }
      if (o.min && s < o.min) { return 'Date must be on or after ' + Fmt.date(o.min) + '.'; }
      if (o.max && s > o.max) { return 'Date must be on or before ' + Fmt.date(o.max) + '.'; }
      return null;
    },
    // Validates only the keys present in patch. Error keys: phone, email, address.line1, address.city, address.postcode.
    contact: function (patch) {
      var errors = {};
      var p = patch || {};
      var e;
      if (p.phone !== undefined && (e = Validate.phone(p.phone))) { errors.phone = e; }
      if (p.email !== undefined && (e = Validate.email(p.email))) { errors.email = e; }
      if (p.address !== undefined) {
        var a = p.address || {};
        if (isBlank(a.line1)) { errors['address.line1'] = 'Enter the first line of the address.'; }
        if (isBlank(a.city)) { errors['address.city'] = 'Enter a town or city.'; }
        if ((e = Validate.postcode(a.postcode))) { errors['address.postcode'] = e; }
      }
      return errors;
    }
  };

  window.Clock = Clock;
  window.Store = Store;
  window.Auth = Auth;
  window.Fmt = Fmt;
  window.Validate = Validate;
})();
