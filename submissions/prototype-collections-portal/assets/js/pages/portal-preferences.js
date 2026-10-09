/* portal-preferences: reminder opt-out and channel. Opened from the reminder link (?t=<token>) with no sign-in; shows no name or account data. Opting out needs no sign-in; turning reminders back on does. US-49. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var token = UI.query('t');
  var verifiedId = Auth.verifiedCustomer();
  var customer = null;
  var problem = null;

  if (token) {
    customer = Services.customerByToken(token);
    if (!customer) { problem = 'link'; }
  } else if (verifiedId) {
    customer = Store.find('customers', verifiedId);
  }
  // A signed-in customer may only manage their own preferences.
  if (customer && verifiedId && customer.id !== verifiedId) { problem = 'other'; customer = null; }

  // True only when the visitor has signed in as this customer.
  function isVerified() { return !!customer && verifiedId === customer.id; }

  function privacyLine() {
    return el('p', { class: 'muted' }, ['We use your details only to manage your account and send the messages you see here.']);
  }

  function backLink() {
    return verifiedId
      ? el('a', { class: 'btn', href: 'portal-account.html' }, ['Go to my account'])
      : el('a', { class: 'btn', href: 'portal-verify.html' }, ['Sign in to view my account']);
  }

  function showProblem() {
    var text = problem === 'other'
      ? 'This link is for a different customer. You are signed in as someone else, and you can only change your own preferences.'
      : 'We could not recognise this link. Please use the link in your most recent reminder message, or speak to a rep.';
    main.appendChild(el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--error', role: 'alert' }, [text]),
      problem === 'other' ? el('div', null, [el('a', { class: 'btn', href: 'portal-preferences.html' }, ['Manage my own preferences'])]) : null,
      Portal.repContactPanel(),
      privacyLine()
    ]));
  }

  // Demo shortcut standing in for the personal link in a reminder message; it goes to the tokenised link.
  function showPicker() {
    var select = el('select', {
      class: 'select', 'aria-label': 'Reminder recipient', onchange: function (e) {
        var picked = e.target.value ? Store.find('customers', e.target.value) : null;
        if (picked) { window.location.href = Services.preferencesLink(picked); }
      }
    }, [el('option', { value: '' }, ['Choose a reminder...'])].concat(Store.get('customers').map(function (c) {
      return el('option', { value: c.id }, ['Reminder sent to account ' + c.accountNo]);
    })));
    main.appendChild(el('div', { class: 'stack' }, [
      UI.panel('Open this page from a reminder message', el('div', { class: 'stack' }, [
        el('p', null, ['Reminder preferences are opened from the link at the bottom of each reminder message, so no sign-in is needed. This page was opened without that link.']),
        el('div', { class: 'demo-only' }, [
          el('span', { class: 'badge badge--demo' }, ['Demo only']),
          el('details', null, [
            el('summary', null, ['Demo helper: stands in for the link in a reminder email']),
            el('div', { class: 'demo-control', style: 'margin-top: .5rem;' }, [el('span', null, ['Open the link from the reminder sent to ']), select])
          ])
        ]),
        el('p', null, ['Or ', el('a', { href: 'portal-verify.html' }, ['verify your identity']), ' to manage preferences from your account.']),
        privacyLine()
      ]), { note: 'In production the link carries a signed, expiring token that identifies the customer, so the account number is never typed or guessed.' })
    ]));
  }

  // Channel choices. Unverified visitors may only narrow the channels, never add one.
  function channelOptions(current, verified) {
    var all = [{ value: 'email', label: 'Email' }, { value: 'sms', label: 'Text message' }, { value: 'both', label: 'Email and text message' }];
    if (verified || current === 'both') { return all; }
    return all.filter(function (o) { return o.value === current; });
  }

  function render(saved) {
    main.textContent = '';
    var c = Store.find('customers', customer.id);
    var prefs = c.reminderPrefs || {};
    var verified = isVerified();
    var channel = ['email', 'sms', 'both'].indexOf(prefs.channel) >= 0 ? prefs.channel : 'email';
    var options = channelOptions(channel, verified);
    var locked = !!prefs.optedOut && !verified;

    var fields = [];
    if (!locked) {
      fields.push(UI.field({ label: 'Stop sending me payment reminder messages', name: 'optedOut', type: 'checkbox', value: !!prefs.optedOut }));
      if (options.length > 1) {
        fields.push(UI.field({ label: 'If I still get reminders, send them by', name: 'channel', type: 'radio', value: channel, options: options }));
      }
      fields.push(el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save preferences']));
    }
    var form = el('form', { novalidate: true }, fields);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var payload = { channel: v.channel || channel };
      if (v.optedOut) {
        payload.optedOut = true;
      } else if (prefs.optedOut || verified) {
        payload.optedOut = false;
      }
      var res = Services.setReminderPrefs(c.id, payload, verified ? 'portal-verified' : null);
      if (!res.ok) { UI.showErrors(form, { _form: res.error }); return; }
      render({ optedOut: !!res.reminderPrefs.optedOut });
    });

    var parts = [];
    if (saved) {
      parts.push(saved.optedOut
        ? el('div', { class: 'notice notice--ok', role: 'status' }, ['Your opt-out is recorded. It takes effect within ', Portal.settingNode('optOutHours'), ' hours, so a reminder already queued may still reach you until then.'])
        : el('div', { class: 'notice notice--ok', role: 'status' }, ['Your preferences are saved. You will keep getting payment reminders.']));
    }
    parts.push(UI.panel('Reminder preferences', el('div', { class: 'stack' }, [
      el('div', null, [prefs.optedOut ? UI.badge('Reminders off (opted out)', 'warn') : UI.badge('Reminders on', 'ok')]),
      prefs.optedOut && prefs.optedOutAt ? el('p', { class: 'muted' }, ['Opt-out recorded on ' + Fmt.datetime(prefs.optedOutAt) + '.']) : null,
      el('p', null, ['Choose whether we send you payment reminder messages and how. This does not change what you owe.']),
      el('div', { class: 'notice notice--info' }, [
        'Opting out stops payment reminder messages only. We may still make follow-up calls, send missing-payment notices and contact you about your account. ' +
        'To limit that contact, speak to a collections rep on ' + Services.REP_CONTACT_PHONE + '.'
      ]),
      locked
        ? el('div', { class: 'notice notice--warn' }, ['To turn reminders back on, ', el('a', { href: 'portal-verify.html' }, ['sign in']), ' first so we know it is you.'])
        : null,
      !verified && !locked
        ? el('p', { class: 'muted' }, ['Without signing in you can switch reminders off or reduce the channels. To turn reminders back on later you will need to sign in.'])
        : null,
      form,
      privacyLine()
    ]), { note: ['Every reminder carries this link, which holds an opaque token and no account data. The opt-out must take effect within ', Portal.settingNode('optOutHours'), ' hours (the reminder job reads the preference before it sends). Opting out is safe without sign-in; turning reminders back on needs the customer to be verified, so a forwarded email cannot re-subscribe someone.'] }));
    parts.push(el('div', null, [backLink()]));
    main.appendChild(el('div', { class: 'stack' }, parts));
  }

  if (problem) { showProblem(); } else if (!customer) { showPicker(); } else { render(); }
});
