/* index.js: Dedicated Home Page with Customer Login & Signup and Staff Login only. */
(function () {
  'use strict';

  var el = UI.el;

  function buildEvaluatorHub() {
    var box = el('div', { class: 'demo-only' }, [
      el('span', { class: 'badge badge--demo' }, ['Demo only']),
      el('strong', null, ['Reviewer & Evaluator Hub: ']),
      'Looking for pre-seeded test accounts, role walkthroughs, or the prototype sitemap? Open the ',
      el('a', { href: 'demo.html' }, [el('strong', null, ['Demo Guide & Sitemap'])]),
      ' or use the orange demo bar above.'
    ]);
    return box;
  }

  function buildCustomerSignIn() {
    var form = el('form', { class: 'stack', novalidate: true });
    var msgHolder = el('div', { 'aria-live': 'polite' });

    var acctField = UI.field({
      name: 'accountNo', label: 'Account number', type: 'text',
      placeholder: 'e.g. 100001', required: true,
      help: 'Found on your collection notice or statement.'
    });
    var dobField = UI.field({
      name: 'dob', label: 'Date of birth', type: 'text',
      placeholder: 'YYYY-MM-DD', required: true,
      help: 'Format: YYYY-MM-DD (e.g. 1988-04-12)'
    });
    var postcodeField = UI.field({
      name: 'postcode', label: 'Postcode', type: 'text',
      placeholder: 'e.g. M14 5QT', required: true,
      help: 'Your current residential postcode'
    });

    form.appendChild(msgHolder);
    form.appendChild(acctField);
    form.appendChild(dobField);
    form.appendChild(postcodeField);
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Sign In to My Account'])
    ]));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msgHolder.textContent = '';
      var vals = UI.readForm(form);
      var acct = vals.accountNo ? vals.accountNo.trim() : '';
      var dob = vals.dob ? vals.dob.trim() : '';
      var postcode = vals.postcode ? vals.postcode.trim() : '';

      if (!acct || !dob || !postcode) {
        msgHolder.appendChild(el('div', { class: 'notice notice--error', role: 'alert' }, [
          'Please enter your account number, date of birth and postcode.'
        ]));
        return;
      }

      var res = Services.verify(acct, { dob: dob, postcode: postcode }, { method: 'portal' });

      if (res.result === 'Verified' && res.customerId) {
        Auth.setRole('customer');
        Auth.setVerified(res.customerId);
        window.location.href = 'portal-account.html';
      } else {
        msgHolder.appendChild(el('div', { class: 'notice notice--error', role: 'alert' }, [
          'We could not verify those details. Please check your account number, date of birth and postcode.'
        ]));
      }
    });

    return el('div', { class: 'stack' }, [
      el('p', null, ['Sign in to view your balance, make payments, arrange a promise to pay, or manage communication preferences.']),
      form
    ]);
  }

  function buildCustomerSignUp() {
    var form = el('form', { class: 'stack', novalidate: true });
    var msgHolder = el('div', { 'aria-live': 'polite' });

    var nameField = UI.field({ name: 'name', label: 'Full name', type: 'text', placeholder: 'e.g. Alex Hartley', required: true });
    var dobField = UI.field({ name: 'dob', label: 'Date of birth', type: 'text', placeholder: 'YYYY-MM-DD (e.g. 1990-05-15)', required: true });
    var line1Field = UI.field({ name: 'line1', label: 'Address line 1', type: 'text', placeholder: 'e.g. 12 High Street', required: true });
    var cityField = UI.field({ name: 'city', label: 'Town or city', type: 'text', placeholder: 'e.g. Manchester', required: true });
    var postcodeField = UI.field({ name: 'postcode', label: 'Postcode', type: 'text', placeholder: 'e.g. M14 5QT', required: true });
    var phoneField = UI.field({ name: 'phone', label: 'Phone number', type: 'text', placeholder: 'e.g. 07700 900123', required: true });
    var emailField = UI.field({ name: 'email', label: 'Email address', type: 'email', placeholder: 'e.g. alex@example.com', required: true });
    var balanceField = UI.field({ name: 'balance', label: 'Initial outstanding balance (£)', type: 'text', value: '250.00', required: true });
    var consentField = UI.field({
      name: 'consent', label: 'I agree to the processing of my contact and repayment details to manage my account.',
      type: 'checkbox', required: true,
      help: 'We handle your personal data in accordance with our data protection policy (see demo.html#privacy).'
    });

    var privacyNote = el('div', { class: 'notice notice--info' }, [
      el('strong', null, ['Data protection: ']),
      'We use your details to manage your repayment account under UK GDPR. You can exercise your rights of access, correction, erasure and objection at any time. ',
      el('a', { href: 'demo.html#privacy' }, ['Read the privacy notice'])
    ]);

    form.appendChild(msgHolder);
    form.appendChild(nameField);
    form.appendChild(dobField);
    form.appendChild(line1Field);
    form.appendChild(cityField);
    form.appendChild(postcodeField);
    form.appendChild(phoneField);
    form.appendChild(emailField);
    form.appendChild(balanceField);
    form.appendChild(privacyNote);
    form.appendChild(consentField);
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Register & Sign In'])
    ]));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msgHolder.textContent = '';
      var vals = UI.readForm(form);
      var errors = {};

      if (!vals.name || !vals.name.trim()) { errors.name = 'Enter your full name.'; }
      var dobErr = Validate.date(vals.dob);
      if (dobErr) { errors.dob = dobErr; }
      if (!vals.line1 || !vals.line1.trim()) { errors.line1 = 'Enter your address line 1.'; }
      if (!vals.city || !vals.city.trim()) { errors.city = 'Enter your town or city.'; }
      var postErr = Validate.postcode(vals.postcode);
      if (postErr) { errors.postcode = postErr; }
      var phoneErr = Validate.phone(vals.phone);
      if (phoneErr) { errors.phone = phoneErr; }
      var emailErr = Validate.email(vals.email);
      if (emailErr) { errors.email = emailErr; }
      var balErr = Validate.amount(vals.balance);
      if (balErr) { errors.balance = balErr; }
      if (!vals.consent) { errors.consent = 'You must confirm agreement to proceed.'; }

      if (Object.keys(errors).length > 0) {
        UI.showErrors(form, errors);
        return;
      }

      var customers = Store.get('customers') || [];
      var maxAcct = 100000;
      customers.forEach(function (c) {
        var num = parseInt(c.accountNo, 10);
        if (!isNaN(num) && num > maxAcct) { maxAcct = num; }
      });
      var newAcctNo = String(maxAcct + 1);
      var balNum = parseFloat(vals.balance.replace(/[\u00a3,]/g, '')) || 250.00;

      var newCust = {
        accountNo: newAcctNo,
        name: vals.name.trim(),
        dob: vals.dob.trim(),
        postcode: vals.postcode.trim().toUpperCase(),
        address: {
          line1: vals.line1.trim(),
          city: vals.city.trim(),
          postcode: vals.postcode.trim().toUpperCase()
        },
        phone: vals.phone.trim(),
        email: vals.email.trim(),
        balance: balNum,
        originalBalance: balNum,
        dueDate: Clock.addDays(Clock.today(), 14),
        team: 'A',
        locked: false,
        failedAttempts: 0,
        emailBounced: false,
        delinquencyHold: false,
        ledgerRef: 'LEGACY-' + newAcctNo,
        internalNotes: 'Self-registered online customer account.',
        editableFields: ['phone', 'email', 'address'],
        unsubToken: 'tok_reg_' + newAcctNo,
        reminderPrefs: { optedOut: false, channel: 'email', optedOutAt: null },
        preferred: { channel: 'email', from: '09:00', to: '17:00' },
        lastChange: null
      };

      var inserted = Store.insert('customers', newCust);
      Services.audit({
        entity: 'customer', entityId: inserted.id, customerId: inserted.id, action: 'customer-signup',
        after: { accountNo: inserted.accountNo, name: inserted.name, balance: inserted.balance },
        note: 'Customer self-registered online.'
      });

      Auth.setRole('customer');
      Auth.setVerified(inserted.id);
      window.location.href = 'portal-account.html';
    });

    return el('div', { class: 'stack' }, [
      el('p', null, ['New to the portal? Create your online account to manage repayments and track payments.']),
      form
    ]);
  }

  function buildCustomerPanel() {
    return UI.panel('Customer Portal', el('div', { class: 'stack' }, [
      UI.tabs([
        { id: 'sign-in', label: 'Customer Sign In', render: function (c) { c.appendChild(buildCustomerSignIn()); } },
        { id: 'sign-up', label: 'New Customer Registration', render: function (c) { c.appendChild(buildCustomerSignUp()); } }
      ])
    ]));
  }

  function buildStaffPanel() {
    var form = el('form', { class: 'stack', novalidate: true });
    var msgHolder = el('div', { 'aria-live': 'polite' });

    var users = Store.get('users') || [];
    var options = users.map(function (u) {
      var rLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1);
      var label = u.name + ' (' + rLabel + (u.team ? ', Team ' + u.team : '') + ')';
      return { value: u.id, label: label };
    });

    var userSelect = UI.field({
      name: 'userId', label: 'Staff member account', type: 'select',
      options: options,
      help: 'Select your assigned staff identity'
    });

    var pinField = UI.field({
      name: 'pin', label: 'Staff PIN / Password', type: 'password',
      value: 'demo123',
      help: 'Enter your staff credential (demo: demo123)'
    });

    form.appendChild(msgHolder);
    form.appendChild(userSelect);
    form.appendChild(pinField);
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Staff Sign In'])
    ]));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var vals = UI.readForm(form);
      var u = Store.find('users', vals.userId);
      if (u) {
        Auth.setRole(u.role);
        Auth.setUser(u.id);
        window.location.href = Auth.homeFor(u.role);
      } else {
        msgHolder.appendChild(el('div', { class: 'notice notice--error' }, ['Please select a valid staff user.']));
      }
    });

    return UI.panel('Staff Workspace', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--info' }, [
        el('strong', null, ['Staff Sign In Only: ']),
        'Staff accounts are centrally provisioned by system administration. Self-registration is restricted for security and regulatory compliance.'
      ]),
      form
    ]));
  }

  Layout.ready(function (main) {
    main.appendChild(el('div', { class: 'stack' }, [
      buildEvaluatorHub(),
      el('div', { class: 'grid grid--2' }, [
        buildCustomerPanel(),
        buildStaffPanel()
      ])
    ]));
  });
})();
