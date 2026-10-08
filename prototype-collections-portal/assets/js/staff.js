/*
 * staff.js: Staff (shared helpers for the staff-* pages). Load after layout.js, before the page script.
 *
 * Staff.accountParam()                      -> trimmed ?acct= value ('' if absent)
 * Staff.findByAccountNo(accountNo)          -> customer | null
 * Staff.recordHref(accountNo) / logHref(accountNo)
 * Staff.noAccountPanel(task)                -> panel for a missing ?acct= (links to staff-search)
 * Staff.notFoundPanel(accountNo)            -> panel for an unknown account number
 * Staff.restricted(fieldKey, content)       -> content, or "Restricted for your role" when Auth.canSeeField is false
 * Staff.accessMode(customerId)              -> 'phone' | 'internal' | null (for the current staff user only)
 * Staff.isUnlocked(customerId)              -> true once phone verification passed or an internal review was started
 * Staff.verificationResult(customerId)      -> 'Verified' | 'Not verified' (stored on promises made by a rep)
 * Staff.verificationPanel(customer, onChange) / Staff.accessBar(customer, onChange) / Staff.clearAccess(customerId)
 * Staff.markSearch(accountNo) / Staff.openedSeconds(accountNo)  -> elapsed time for "Opened in n s"
 * Staff.userName(id), Staff.teamOf(userId), Staff.teamReps(team)
 *
 * Session state: sessionStorage 'cpp.staffAccess' = { customerId: {mode, userId} }. Tying it to the staff user means
 * switching user in the header does not carry over another rep's verification.
 */
(function () {
  'use strict';

  var el = UI.el;
  var ACCESS_KEY = 'staffAccess';

  function currentUserId() {
    var u = Auth.user();
    return u ? u.id : null;
  }

  function accessMap() { return Store.session.get(ACCESS_KEY) || {}; }

  function setAccess(customerId, mode) {
    var map = accessMap();
    map[customerId] = { mode: mode, userId: currentUserId() };
    Store.session.set(ACCESS_KEY, map);
  }

  function accessMode(customerId) {
    var entry = accessMap()[customerId];
    if (!entry || entry.userId !== currentUserId()) { return null; }
    if (entry.mode === 'phone') { return Auth.phoneVerified(customerId) ? 'phone' : null; }
    return entry.mode === 'internal' ? 'internal' : null;
  }

  function clearAccess(customerId) {
    var map = accessMap();
    delete map[customerId];
    Store.session.set(ACCESS_KEY, map);
    Auth.setPhoneVerified(customerId, false);
  }

  function accountParam() { return (UI.query('acct') || '').trim(); }

  function findByAccountNo(accountNo) {
    var a = String(accountNo === null || accountNo === undefined ? '' : accountNo).trim();
    return a ? Store.find('customers', function (c) { return String(c.accountNo) === a; }) : null;
  }

  function recordHref(accountNo) { return 'staff-record.html?acct=' + encodeURIComponent(accountNo); }
  function logHref(accountNo) { return 'staff-log.html?acct=' + encodeURIComponent(accountNo); }

  function noAccountPanel(task) {
    return UI.panel('Choose a customer first', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--info' }, ['No customer is selected. Search by account number to ' + task + '.']),
      el('div', { class: 'row' }, [el('a', { class: 'btn btn--primary', href: 'staff-search.html' }, ['Go to customer search'])])
    ]));
  }

  function notFoundPanel(accountNo) {
    return UI.panel('Customer not found', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--error' }, ['No customer found for account number "' + String(accountNo).slice(0, 20) + '".']),
      el('div', { class: 'row' }, [el('a', { class: 'btn btn--primary', href: 'staff-search.html' }, ['Search again'])])
    ]));
  }

  function restricted(fieldKey, content) {
    return Auth.canSeeField(fieldKey) ? content : el('em', { class: 'muted' }, ['Restricted for your role']);
  }

  function verificationResult(customerId) {
    return accessMode(customerId) === 'phone' ? 'Verified' : 'Not verified';
  }

  // Caller verification and the "Internal review (no caller)" route. onChange runs after the state changes.
  function verificationPanel(customer, onChange) {
    var result = el('div', { 'aria-live': 'polite' });

    var form = el('form', { novalidate: true, autocomplete: 'off' }, [
      UI.field({ label: 'Caller date of birth', name: 'dob', type: 'date', required: true }),
      UI.field({ label: 'Caller postcode', name: 'postcode', type: 'text', required: true, attrs: { autocomplete: 'off' } }),
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Verify caller'])
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var errors = {};
      if (Validate.required(v.dob)) { errors.dob = 'Enter the caller\'s date of birth.'; }
      if (Validate.required(v.postcode)) { errors.postcode = 'Enter the caller\'s postcode.'; }
      UI.showErrors(form, errors);
      result.textContent = '';
      if (Object.keys(errors).length) { return; }
      var res = Services.verify(customer.accountNo, { dob: v.dob, postcode: v.postcode }, { method: 'phone', actorId: currentUserId() });
      form.reset();
      if (res.result === 'Verified') {
        Auth.setPhoneVerified(customer.id, true);
        setAccess(customer.id, 'phone');
        UI.toast('Caller verified.', 'ok');
        onChange();
        return;
      }
      result.appendChild(el('div', { class: 'notice notice--error', role: 'alert' }, [
        el('strong', null, ['Not verified. ']), 'Do not discuss the account. You can try again or end the call.'
      ]));
    });

    var reviewForm = el('form', { novalidate: true, autocomplete: 'off' }, [
      UI.field({
        label: 'Reason for internal review', name: 'reason', type: 'text', required: true,
        help: 'Written to the audit trail. Unlocking an account still needs a phone verification.'
      }),
      el('button', { type: 'submit', class: 'btn' }, ['Internal review (no caller)'])
    ]);
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(reviewForm);
      if (Validate.required(v.reason)) {
        UI.showErrors(reviewForm, { reason: 'Enter a reason for the internal review.' });
        return;
      }
      Services.audit({
        entity: 'verification', entityId: customer.id, customerId: customer.id, action: 'internal-review',
        note: 'Internal review (no caller): ' + v.reason
      });
      setAccess(customer.id, 'internal');
      UI.toast('Internal review started and logged.', 'info');
      onChange();
    });

    return UI.panel('Verify the caller', el('div', { class: 'stack' }, [
      el('p', null, ['Ask the caller for their date of birth and postcode, then submit. The result is only Verified or Not verified, and it never says which detail was wrong.']),
      form,
      result,
      el('hr'),
      el('h3', null, ['No caller on the line?']),
      el('p', { class: 'muted' }, ['Use the internal review route for back-office work on this account.']),
      reviewForm
    ]), {
      note: 'The rep screen calls the same identity service as the portal (POST /identity/verify). Only the outcome is stored, with rep ID, customer ID and time. Answers are never kept.'
    });
  }

  // Status bar shown once the record is open, with a way to end the verification.
  function accessBar(customer, onChange) {
    var phone = accessMode(customer.id) === 'phone';
    var text = phone
      ? [el('strong', null, ['Verified. ']), 'The caller\'s identity was confirmed by phone.']
      : [el('strong', null, ['Internal review (no caller). ']), 'Opened for back-office work and logged to the audit trail. Do not disclose details to a caller.'];
    return el('div', { class: 'notice ' + (phone ? 'notice--ok' : 'notice--info') }, [
      el('div', { class: 'row' }, [
        el('span', null, text),
        el('button', { type: 'button', class: 'btn btn--small', onclick: function () { clearAccess(customer.id); onChange(); } }, ['End verification'])
      ])
    ]);
  }

  function markSearch(accountNo) {
    Store.session.set('staffSearchStart', { acct: String(accountNo), t: Date.now() });
  }

  // Seconds since the search was submitted; falls back to this page's load time when opened directly.
  function openedSeconds(accountNo) {
    var mark = Store.session.get('staffSearchStart');
    Store.session.remove('staffSearchStart');
    var ms = Math.round(window.performance && performance.now ? performance.now() : 0);
    if (mark && mark.acct === String(accountNo) && Date.now() - mark.t < 60000) { ms = Date.now() - mark.t; }
    return ms / 1000;
  }

  function userName(id) {
    var u = id ? Store.find('users', String(id)) : null;
    return u ? u.name : (id || '');
  }

  function teamOf(userId) {
    var u = userId ? Store.find('users', String(userId)) : null;
    return u ? u.team : null;
  }

  function teamReps(team) {
    return Store.get('users').filter(function (u) { return u.role === 'rep' && u.team === team; });
  }

  window.Staff = {
    accountParam: accountParam,
    findByAccountNo: findByAccountNo,
    recordHref: recordHref,
    logHref: logHref,
    noAccountPanel: noAccountPanel,
    notFoundPanel: notFoundPanel,
    restricted: restricted,
    accessMode: accessMode,
    isUnlocked: function (customerId) { return accessMode(customerId) !== null; },
    clearAccess: clearAccess,
    verificationResult: verificationResult,
    verificationPanel: verificationPanel,
    accessBar: accessBar,
    markSearch: markSearch,
    openedSeconds: openedSeconds,
    userName: userName,
    teamOf: teamOf,
    teamReps: teamReps
  };
})();
