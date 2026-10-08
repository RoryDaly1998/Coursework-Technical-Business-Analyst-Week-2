/* Seed configuration (fake demo data). Read only by Store.init(); shapes follow PLAN.md section 5. */
window.SEED_CONFIG = {
  roles: [
    { id: 'customer', label: 'Customer', home: 'portal-verify' },
    { id: 'rep', label: 'Collections rep', home: 'staff-search' },
    { id: 'leader', label: 'Team leader', home: 'staff-search' },
    { id: 'finance', label: 'Finance', home: 'report-balances-arrears' },
    { id: 'compliance', label: 'Compliance', home: 'report-audit-trail' },
    { id: 'it', label: 'IT', home: 'report-security-status' }
  ],

  users: [
    { id: 'REP-01', name: 'Sam Patel', role: 'rep', team: 'A' },
    { id: 'REP-02', name: 'Jo Okafor', role: 'rep', team: 'A' },
    { id: 'REP-03', name: 'Lee Chen', role: 'rep', team: 'B' },
    { id: 'TL-01', name: 'Priya Nair', role: 'leader', team: 'A' },
    { id: 'FIN-01', name: 'Fiona Blake', role: 'finance', team: null },
    { id: 'COM-01', name: 'Colm Reilly', role: 'compliance', team: null },
    { id: 'IT-01', name: 'Imran Siddiqui', role: 'it', team: null }
  ],

  outcomeCodes: [
    { code: 'PTP', label: 'Promise to pay', followUp: true, followUpDays: 3, requiresPromise: true },
    { code: 'NA', label: 'No answer', followUp: true, followUpDays: 2, requiresPromise: false },
    { code: 'CB', label: 'Call back requested', followUp: true, followUpDays: 1, requiresPromise: false },
    { code: 'DISP', label: 'Disputed', followUp: true, followUpDays: 5, requiresPromise: false },
    { code: 'PAID', label: 'Payment taken', followUp: false, followUpDays: 0, requiresPromise: false },
    { code: 'REFUSED', label: 'Refused to pay', followUp: true, followUpDays: 7, requiresPromise: false },
    { code: 'WRONG', label: 'Wrong person or number', followUp: false, followUpDays: 0, requiresPromise: false },
    { code: 'HARD', label: 'Hardship raised', followUp: true, followUpDays: 2, requiresPromise: false }
  ],

  contactMethods: ['Phone', 'Email', 'SMS', 'Letter'],

  nextActions: [
    'Call back',
    'Send reminder',
    'Await promised payment',
    'Review account',
    'Escalate to team leader',
    'No further action'
  ],

  // Fields not listed are visible to every role. Keys match customer record field names (plus history/followups).
  fieldAccess: {
    phone: ['rep', 'leader'],
    email: ['rep', 'leader'],
    address: ['rep', 'leader'],
    balance: ['rep', 'leader'],
    history: ['rep', 'leader'],
    followups: ['rep', 'leader'],
    dob: ['leader'],
    internalNotes: ['leader'],
    ledgerRef: ['leader']
  },

  // Every setting: {value, tbd, min, max, demo, label, unit}. TBD items show as "TBD (demo: n)".
  settings: {
    lockoutThreshold: { value: 3, tbd: true, min: 1, max: 10, demo: 3, label: 'Failed attempts before lockout', unit: 'attempts' },
    alertThreshold: { value: 5, tbd: true, min: 1, max: 50, demo: 5, label: 'Failed attempts that raise an alert', unit: 'attempts' },
    alertWindowMinutes: { value: 10, tbd: true, min: 1, max: 1440, demo: 10, label: 'Alert time window', unit: 'minutes' },
    promiseWindow: { value: 14, tbd: true, min: 1, max: 14, demo: 14, label: 'Promise date window (from today)', unit: 'days' },
    promisePlans: { value: [100, 50, 25], tbd: false, min: null, max: null, demo: null, label: 'Permitted promise plans (percent of balance)', unit: '% of balance' },
    contactLimit: { value: 3, tbd: true, min: 1, max: 10, demo: 3, windowDays: 7, label: 'Contact limit per customer', unit: 'contacts per 7 days' },
    reminderDaysBefore: { value: 3, tbd: true, min: 1, max: 14, demo: 3, label: 'Reminder lead time before due date', unit: 'days' },
    optOutHours: { value: 24, tbd: true, min: 1, max: 72, demo: 24, label: 'Opt-out takes effect within', unit: 'hours' },
    jobRetries: { value: 2, tbd: true, min: 0, max: 5, demo: 2, label: 'Automatic retries for a failed job run', unit: 'retries' },
    jobDeadline: { value: '07:00', tbd: true, min: null, max: null, demo: '07:00', label: 'Job must succeed by', unit: 'time of day' },
    failureRateThreshold: { value: 10, tbd: true, min: 1, max: 100, demo: 10, label: 'Reminder failure rate that raises an alert', unit: '%' },
    retentionYears: { value: 7, tbd: true, min: 1, max: 25, demo: 7, label: 'Audit and log retention', unit: 'years' },
    backupFrequency: { value: 'Daily', tbd: true, min: null, max: null, demo: 'Daily', label: 'Backup frequency', unit: '' },
    recoveryTimeObjective: { value: 4, tbd: true, min: 1, max: 72, demo: 4, label: 'Recovery time after a test restore', unit: 'hours' },
    reversalReasonCodes: {
      value: [
        { code: 'DUPLICATE', label: 'Duplicate payment' },
        { code: 'ERROR', label: 'Payment taken in error' },
        { code: 'CHARGEBACK', label: 'Card chargeback' },
        { code: 'REFUND', label: 'Approved refund' }
      ],
      tbd: false, min: null, max: null, demo: null, label: 'Reversal reason codes', unit: ''
    }
  },

  // Placeholders use {{name}}, {{amount}}, {{dueDate}} or {{date}}, {{reference}}, {{what}}, {{phone}}, {{link}}; Services.renderTemplate fills them.
  templates: [
    {
      id: 'TPL-1', name: 'Reminder before due (email)', version: 1, status: 'Approved',
      body: 'Hello {{name}}, your payment of {{amount}} is due on {{dueDate}}. You can pay online or contact us if you need help. To change or stop reminders, use the preferences link.',
      approvedBy: 'COM-01', approvedAt: '-60d@10:00'
    },
    {
      id: 'TPL-2', name: 'Reminder before due (email)', version: 2, status: 'Pending',
      body: 'Hello {{name}}, a payment of {{amount}} is due on {{dueDate}}. Pay online in a few steps, or call us if you would like to talk about your options. You can change your reminder preferences at any time.',
      approvedBy: null, approvedAt: null
    },
    {
      id: 'TPL-3', name: 'Payment confirmation', version: 1, status: 'Approved',
      body: 'Hello {{name}}, we received your payment of {{amount}} on {{date}}. Your reference is {{reference}}. Thank you.',
      approvedBy: 'COM-01', approvedAt: '-90d@09:30'
    },
    {
      id: 'TPL-4', name: 'Missing payment', version: 2, status: 'Approved',
      body: 'Hello {{name}}, we expected a payment of {{amount}} on {{dueDate}} but have not received it. Please pay online, or contact your collections rep to talk through your options.',
      approvedBy: 'COM-01', approvedAt: '-45d@14:00'
    },
    {
      id: 'TPL-5', name: 'Missing payment', version: 1, status: 'Superseded',
      body: 'Hello {{name}}, your payment of {{amount}} was due on {{dueDate}} and has not arrived. Please pay now.',
      approvedBy: 'COM-01', approvedAt: '-200d@11:15'
    },
    {
      id: 'TPL-6', name: 'Details changed', version: 1, status: 'Approved',
      body: 'Hello {{name}}, the {{what}} on your account was changed. If you made this change, no action is needed. If you did not, report it straight away: call {{phone}} and say it was an unauthorised change.',
      approvedBy: 'COM-01', approvedAt: '-90d@09:45'
    },
    {
      id: 'TPL-7', name: 'Reminder before due (SMS)', version: 1, status: 'Approved',
      body: 'Reminder: you have a payment due. Sign in to see details: {{link}}',
      approvedBy: 'COM-01', approvedAt: '-60d@10:10'
    },
    {
      id: 'TPL-8', name: 'Payment reversed', version: 1, status: 'Approved',
      body: 'Hello {{name}}, a payment of {{amount}} on your account was reversed. Your balance has been corrected. Reference {{reference}}.',
      approvedBy: 'COM-01', approvedAt: '-90d@10:00'
    },
    {
      id: 'TPL-9', name: 'Promise confirmation', version: 1, status: 'Approved',
      body: 'Hello {{name}}, thank you. We have recorded your promise to pay {{amount}} by {{date}} (reference {{reference}}). We will pause reminder calls until that date. If you need to change the plan, sign in to your account or call {{phone}}.',
      approvedBy: 'COM-01', approvedAt: '-90d@10:15'
    }
  ]
};
