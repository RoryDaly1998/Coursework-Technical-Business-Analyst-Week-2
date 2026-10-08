/* Seed customers (fake demo data, nine personas). Relative dates resolve against the demo clock on first load. */
window.SEED_CUSTOMERS = [
  {
    id: 'C-1001', accountNo: '100001', name: 'Alex Hartley', dob: '1988-04-12', postcode: 'M14 5QT',
    email: 'alex.hartley@example.com', phone: '07700900101',
    address: { line1: '14 Elm Road', city: 'Manchester', postcode: 'M14 5QT' },
    balance: 420.00, originalBalance: 650.00, dueDate: '+3d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'email', from: '09:00', to: '17:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Reliable payer who fell behind after a job change. Responds well to email.',
    ledgerRef: 'LDG1A7K2', unsubToken: 'k7Qp2xVd9M', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1002', accountNo: '100002', name: 'Maya Thompson', dob: '1979-09-23', postcode: 'B15 2TT',
    email: 'maya.thompson@example.com', phone: '07700900102',
    address: { line1: '8 Orchard Close', city: 'Birmingham', postcode: 'B15 2TT' },
    balance: 350.00, originalBalance: 500.00, dueDate: '+14d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'email', from: '10:00', to: '16:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Promised a payment through the portal and paid it. Keeps promises.',
    ledgerRef: 'LDG2B4M9', unsubToken: 'T3ndR8wLa5', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1003', accountNo: '100003', name: 'Daniel Okoye', dob: '1992-01-30', postcode: 'LS6 1AB',
    email: 'daniel.okoye@example.com', phone: '07700900103',
    address: { line1: '27 Parkside Terrace', city: 'Leeds', postcode: 'LS6 1AB' },
    balance: 560.00, originalBalance: 800.00, dueDate: '+21d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'phone', from: '17:00', to: '20:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Agreed a promise by phone, then paid only part of it.',
    ledgerRef: 'LDG3C8D5', unsubToken: 'bY6hZc1Ue4', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1004', accountNo: '100004', name: 'Chloe Bennett', dob: '1985-11-05', postcode: 'BS8 3NP',
    email: 'chloe.bennett@example.com', phone: '07700900104',
    address: { line1: '3 Kingsley Mews', city: 'Bristol', postcode: 'BS8 3NP' },
    balance: 390.00, originalBalance: 500.00, dueDate: '+9d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'email', from: '09:00', to: '12:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Refused to commit by phone, then promised online. Nothing paid since.',
    ledgerRef: 'LDG4D2F6', unsubToken: 'Xf9Jm2Ks7P', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1005', accountNo: '100005', name: 'Jamie Carter', dob: '1990-07-19', postcode: 'NE4 6XY',
    email: 'jamie.carter@example.com', phone: '07700900105',
    address: { line1: '52 Ridley Street', city: 'Newcastle', postcode: 'NE4 6XY' },
    balance: 240.00, originalBalance: 300.00, dueDate: '+3d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'sms', from: '12:00', to: '18:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: true, delinquencyHold: true,
    internalNotes: 'Email address bounces. Says a card payment timed out but was charged. Query open.',
    ledgerRef: 'LDG5E6H1', unsubToken: 'q4WvN8rGt1', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1006', accountNo: '100006', name: 'Fatima Rahman', dob: '1975-02-08', postcode: 'G12 8QQ',
    email: 'fatima.rahman@example.com', phone: '07700900106',
    address: { line1: '19 Hillhead Road', city: 'Glasgow', postcode: 'G12 8QQ' },
    balance: 700.00, originalBalance: 700.00, dueDate: '+5d', team: 'A', locked: true, failedAttempts: 3,
    preferred: { channel: 'phone', from: '09:00', to: '13:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Locked after three failed portal checks. Has raised financial hardship.',
    ledgerRef: 'LDG6F3J8', unsubToken: 'Hd5Lz3Bc9y', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1007', accountNo: '100007', name: 'Oliver Grant', dob: '1969-12-17', postcode: 'CF10 2EP',
    email: 'oliver.grant@example.com', phone: '07700900107',
    address: { line1: '5 Bute Lane', city: 'Cardiff', postcode: 'CF10 2EP' },
    balance: 0.00, originalBalance: 380.00, dueDate: '+3d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'email', from: '09:00', to: '17:00' },
    reminderPrefs: { optedOut: false, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Paid in full. A duplicate bank payment was reversed earlier.',
    ledgerRef: 'LDG7G9K4', unsubToken: 'u2EaM7oXv6', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1008', accountNo: '100008', name: 'Sophie Walker', dob: '1983-06-26', postcode: 'SE15 4RT',
    email: 'sophie.walker@example.com', phone: '07700900108',
    address: { line1: '41 Rye Court', city: 'London', postcode: 'SE15 4RT' },
    balance: 450.00, originalBalance: 450.00, dueDate: '+3d', team: 'A', locked: false, failedAttempts: 0,
    preferred: { channel: 'phone', from: '14:00', to: '18:00' },
    reminderPrefs: { optedOut: true, channel: 'email' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Opted out of reminders. Contacted several times this week. Missed an earlier promise.',
    ledgerRef: 'LDG8H5L2', unsubToken: 'R8gYp4Tn3J', editableFields: ['phone', 'email', 'address'], lastChange: null
  },
  {
    id: 'C-1009', accountNo: '100009', name: 'Callum Murray', dob: '1994-10-03', postcode: 'EH6 5JD',
    email: 'callum.murray@example.com', phone: '07700900109',
    address: { line1: '12 Seafield Road', city: 'Edinburgh', postcode: 'EH6 5JD' },
    balance: 400.00, originalBalance: 520.00, dueDate: '+3d', team: 'B', locked: false, failedAttempts: 0,
    preferred: { channel: 'sms', from: '09:00', to: '12:00' },
    reminderPrefs: { optedOut: false, channel: 'sms' },
    emailBounced: false, delinquencyHold: false,
    internalNotes: 'Team B account. Prefers SMS in the morning. Part-paid an earlier promise.',
    ledgerRef: 'LDG9J1M7', unsubToken: 'w1Kc6Fh5Zs', editableFields: ['phone', 'email', 'address'], lastChange: null
  }
];
