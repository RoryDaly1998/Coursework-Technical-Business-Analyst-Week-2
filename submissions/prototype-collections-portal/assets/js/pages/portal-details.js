/* portal-details: edit phone, email and address with field-level validation; the previous contact is notified. US-43, US-44, US-45. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var customerId = Auth.verifiedCustomer();
  var saved = null;

  function savedPanel(info) {
    var names = info.changed.map(function (f) { return f === 'phone' ? 'phone number' : (f === 'email' ? 'email address' : 'address'); });
    var notified = [];
    if (info.changed.indexOf('email') >= 0) { notified.push('previous email address'); }
    if (info.changed.indexOf('phone') >= 0) { notified.push('previous phone number (by text message)'); }
    if (!notified.length) { notified.push('email address we held before'); }
    return el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok', role: 'status' }, [
        'Saved. Your ' + names.join(' and ') + ' ' + (names.length > 1 ? 'have' : 'has') + ' been updated on your account at ' + Fmt.datetime(info.at) + '. Our team can see the change straight away.'
      ]),
      el('div', { class: 'notice notice--info' }, [
        'For your security we have told your ' + notified.join(' and ') + ' about this change, so you can spot one you did not make. ',
        el('a', { href: 'outbox.html' }, ['See the message in My messages'])
      ])
    ]);
  }

  function render() {
    main.textContent = '';
    var c = Store.find('customers', customerId);
    var editable = c.editableFields || [];
    var addr = c.address || {};
    function can(f) { return editable.indexOf(f) >= 0; }

    var controls = [];
    var fixed = [];
    if (can('phone')) { controls.push(UI.field({ label: 'Phone number', name: 'phone', type: 'tel', value: c.phone, required: true, attrs: { autocomplete: 'tel' } })); }
    else { fixed.push(['Phone number', c.phone]); }
    if (can('email')) { controls.push(UI.field({ label: 'Email address', name: 'email', type: 'email', value: c.email, required: true, attrs: { autocomplete: 'email' } })); }
    else { fixed.push(['Email address', c.email]); }
    if (can('address')) {
      controls.push(UI.field({ label: 'Address line 1', name: 'address.line1', value: addr.line1, required: true, attrs: { autocomplete: 'street-address' } }));
      controls.push(UI.field({ label: 'Town or city', name: 'address.city', value: addr.city, required: true, attrs: { autocomplete: 'address-level2' } }));
      controls.push(UI.field({ label: 'Postcode', name: 'address.postcode', value: addr.postcode, required: true, attrs: { autocomplete: 'postal-code' } }));
    } else {
      fixed.push(['Address', [addr.line1, addr.city, addr.postcode].join(', ')]);
    }

    var form = el('form', { novalidate: true }, controls.concat([el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save changes'])]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var now = Store.find('customers', customerId);
      var patch = {};
      if (can('phone') && v.phone !== now.phone) { patch.phone = v.phone; }
      if (can('email') && v.email !== now.email) { patch.email = v.email; }
      if (can('address')) {
        var cur = now.address || {};
        var nw = v.address || {};
        if (nw.line1 !== cur.line1 || nw.city !== cur.city || nw.postcode !== cur.postcode) { patch.address = nw; }
      }
      if (!Object.keys(patch).length) { UI.showErrors(form, { _form: 'You have not changed anything yet.' }); return; }
      var res = Services.updateContactDetails(customerId, patch, { channel: 'portal' });
      if (!res.ok) { UI.showErrors(form, res.errors || { _form: res.error }); return; }
      saved = { changed: res.changed, at: res.customer.lastChange.at };
      render();
    });

    var parts = [];
    if (saved) { parts.push(savedPanel(saved)); saved = null; }
    parts.push(UI.panel('Your contact details', el('div', { class: 'stack' }, [
      el('p', null, ['You can change your phone number, email address and address here. Changes save straight away.']),
      el('div', { class: 'notice notice--info' }, ['Whenever a detail changes we tell the previous email address or phone number, so you can report a change you did not make.']),
      form,
      el('p', { class: 'muted' }, ['We use these details only to contact you about your account.'])
    ]), { note: 'Edits are validated on the server using the same rules the reps use, and only fields on the customer\'s editable list can be changed. Each change is audited with the old and new value. Production would also ask for a one-time code sent to the current email or phone before saving an email or phone change.' }));

    parts.push(UI.panel('Details you cannot change here', el('div', { class: 'stack' }, [
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Name']), el('dd', null, [c.name]),
        el('dt', null, ['Account number']), el('dd', { class: 'mono' }, [c.accountNo]),
        el('dt', null, ['Date of birth']), el('dd', null, [Fmt.date(c.dob)])
      ].concat(fixed.reduce(function (acc, f) { return acc.concat([el('dt', null, [f[0]]), el('dd', null, [f[1]])]); }, []))),
      el('p', { class: 'muted' }, ['Contact us to change these: call a collections rep on ' + Portal.REP_PHONE + '. If a change was not made by you, call us and say so.'])
    ])));
    parts.push(Portal.repContactPanel({ title: 'Report a change you did not make', lead: 'If you see a change you did not make, call us straight away and say it was an unauthorised change.' }));
    parts.push(el('div', null, [el('a', { class: 'btn', href: 'portal-account.html' }, ['Back to my account'])]));
    main.appendChild(el('div', { class: 'stack' }, parts));
  }

  render();
});
