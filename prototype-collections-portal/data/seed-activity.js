/* Seed activity history (fake demo data). Relative dates resolve against the demo clock on first load.
   Customer ids: C-1001..C-1009 are accounts 100001..100009. No card data and no verification answers are stored. */
window.SEED_ACTIVITY = {

  payments: [
    { id: 'PAY-1', customerId: 'C-1001', amount: 100.00, date: '-40d', at: '-40d@11:10', channel: 'phone', status: 'success', reference: 'PMT-A1B2C3', idempotencyKey: 'seed-idem-01' },
    { id: 'PAY-2', customerId: 'C-1001', amount: 80.00, date: '-22d', at: '-22d@18:45', channel: 'portal', status: 'success', reference: 'PMT-D4E5F6', idempotencyKey: 'seed-idem-02', providerToken: 'tok_demo_a1c2e3' },
    { id: 'PAY-3', customerId: 'C-1001', amount: 50.00, date: '-18d', at: '-18d@15:20', channel: 'portal', status: 'success', reference: 'PMT-G7H8J9', idempotencyKey: 'seed-idem-03', providerToken: 'tok_demo_b4d6f8' },
    { id: 'PAY-4', customerId: 'C-1002', amount: 150.00, date: '-3d', at: '-3d@13:40', channel: 'portal', status: 'success', reference: 'PMT-K1L2M3', idempotencyKey: 'seed-idem-04', providerToken: 'tok_demo_c7e9a1' },
    { id: 'PAY-5', customerId: 'C-1003', amount: 160.00, date: '-30d', at: '-30d@10:05', channel: 'phone', status: 'success', reference: 'PMT-N4P5Q6', idempotencyKey: 'seed-idem-05' },
    { id: 'PAY-6', customerId: 'C-1003', amount: 80.00, date: '-2d', at: '-2d@10:11', channel: 'portal', status: 'success', reference: 'PMT-R7S8T9', idempotencyKey: 'seed-idem-06', providerToken: 'tok_demo_d2f4b6' },
    { id: 'PAY-7', customerId: 'C-1004', amount: 110.00, date: '-35d', at: '-35d@09:00', channel: 'bank', status: 'success', reference: 'PMT-U1V2W3', idempotencyKey: 'seed-idem-07' },
    { id: 'PAY-8', customerId: 'C-1005', amount: 60.00, date: '-28d', at: '-28d@09:00', channel: 'bank', status: 'success', reference: 'PMT-X4Y5Z6', idempotencyKey: 'seed-idem-08' },
    { id: 'PAY-9', customerId: 'C-1005', amount: 60.00, date: '-4d', at: '-4d@17:02', channel: 'portal', status: 'failed', reasonCategory: 'Provider timeout', reference: 'PMT-B2C3D4', idempotencyKey: 'seed-idem-09', providerToken: 'tok_demo_e5a7c9' },
    { id: 'PAY-10', customerId: 'C-1007', amount: 380.00, date: '-9d', at: '-9d@12:00', channel: 'portal', status: 'success', reference: 'PMT-E5F6G7', idempotencyKey: 'seed-idem-10', providerToken: 'tok_demo_f8b1d3' },
    { id: 'PAY-11', customerId: 'C-1007', amount: 45.00, date: '-20d', at: '-20d@09:00', channel: 'bank', status: 'reversed', reference: 'PMT-H8J9K1', idempotencyKey: 'seed-idem-11' },
    { id: 'PAY-12', customerId: 'C-1009', amount: 60.00, date: '-40d', at: '-40d@14:05', channel: 'phone', status: 'success', reference: 'PMT-L2M3N4', idempotencyKey: 'seed-idem-12' },
    { id: 'PAY-13', customerId: 'C-1009', amount: 60.00, date: '-11d', at: '-11d@10:30', channel: 'portal', status: 'success', reference: 'PMT-P5Q6R7', idempotencyKey: 'seed-idem-13', providerToken: 'tok_demo_a9c2e4' }
  ],

  promises: [
    { id: 'PRM-1', customerId: 'C-1002', amount: 150.00, dueDate: '+0d', createdAt: '-5d@10:16', source: 'portal', verificationResult: 'Verified', status: 'Active', reference: 'PRMREF-2A41' },
    { id: 'PRM-2', customerId: 'C-1003', amount: 200.00, dueDate: '+0d', createdAt: '-6d@14:30', source: 'rep', verificationResult: 'Verified', status: 'Active', reference: 'PRMREF-3B52', supersedes: 'PRM-7' },
    { id: 'PRM-3', customerId: 'C-1004', amount: 120.00, dueDate: '+0d', createdAt: '-4d@09:41', source: 'portal', verificationResult: 'Verified', status: 'Active', reference: 'PRMREF-4C63' },
    { id: 'PRM-4', customerId: 'C-1001', amount: 130.00, dueDate: '-18d', createdAt: '-25d@11:00', source: 'portal', verificationResult: 'Verified', status: 'Fulfilled', received: 130.00, shortfall: 0, checkedAt: '-18d@16:00', reference: 'PRMREF-1D74' },
    { id: 'PRM-5', customerId: 'C-1008', amount: 90.00, dueDate: '-9d', createdAt: '-20d@13:10', source: 'portal', verificationResult: 'Verified', status: 'Not fulfilled', received: 0, shortfall: 90.00, checkedAt: '-9d@06:00', reference: 'PRMREF-8E85' },
    { id: 'PRM-6', customerId: 'C-1009', amount: 100.00, dueDate: '-10d', createdAt: '-14d@09:40', source: 'rep', verificationResult: 'Verified', status: 'Partially fulfilled', received: 60.00, shortfall: 40.00, checkedAt: '-10d@06:00', reference: 'PRMREF-9F96' },
    { id: 'PRM-7', customerId: 'C-1003', amount: 250.00, dueDate: '+4d', createdAt: '-14d@16:20', source: 'portal', verificationResult: 'Verified', status: 'Superseded', reference: 'PRMREF-3G07' }
  ],

  logs: [
    { id: 'LOG-1', customerId: 'C-1008', kind: 'interaction', at: '-5d@09:30', date: '-5d', method: 'Phone', outcomeCode: 'DISP', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Review account', notes: 'Customer disputes a fee added in the spring. Asked to review.', repId: 'REP-02', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-2', customerId: 'C-1008', kind: 'interaction', at: '-3d@15:40', date: '-3d', method: 'Phone', outcomeCode: 'CB', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'Customer in a meeting. Asked for a call back.', repId: 'REP-02', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-3', customerId: 'C-1008', kind: 'interaction', at: '-1d@11:05', date: '-1d', method: 'Phone', outcomeCode: 'NA', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'No answer. Voicemail left.', repId: 'REP-02', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-4', customerId: 'C-1008', kind: 'reminder', at: '-6d@06:10', date: '-6d', method: 'Email', outcomeCode: null, amount: 450.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Reminder sent before due date.', repId: null, team: 'A', channel: 'system', reference: 'MSG-8', templateId: 'TPL-1' },
    { id: 'LOG-5', customerId: 'C-1008', kind: 'fulfilment', at: '-9d@06:00', date: '-9d', method: null, outcomeCode: null, amount: 0, promiseAmount: 90.00, promiseDate: '-9d', nextAction: null, notes: 'Not fulfilled: promised 90.00, received 0.00, shortfall 90.00.', repId: null, team: 'A', channel: 'system', reference: 'PRM-5', templateId: null },
    { id: 'LOG-6', customerId: 'C-1002', kind: 'promise', at: '-5d@10:16', date: '-5d', method: null, outcomeCode: null, amount: null, promiseAmount: 150.00, promiseDate: '+0d', nextAction: null, notes: 'Promise to pay made in the customer portal.', repId: null, team: 'A', channel: 'portal', reference: 'PRM-1', templateId: null },
    { id: 'LOG-7', customerId: 'C-1002', kind: 'payment', at: '-3d@13:40', date: '-3d', method: null, outcomeCode: null, amount: 150.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Portal payment received.', repId: null, team: 'A', channel: 'portal', reference: 'PMT-K1L2M3', templateId: null },
    { id: 'LOG-8', customerId: 'C-1003', kind: 'interaction', at: '-6d@14:30', date: '-6d', method: 'Phone', outcomeCode: 'PTP', amount: null, promiseAmount: 200.00, promiseDate: '+0d', nextAction: 'Await promised payment', notes: 'Customer agreed to pay 200.00 on the due date. Replaces an earlier portal promise.', repId: 'REP-01', team: 'A', channel: 'rep', reference: 'PRM-2', templateId: null },
    { id: 'LOG-9', customerId: 'C-1003', kind: 'payment', at: '-2d@10:11', date: '-2d', method: null, outcomeCode: null, amount: 80.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Portal payment received.', repId: null, team: 'A', channel: 'portal', reference: 'PMT-R7S8T9', templateId: null },
    { id: 'LOG-10', customerId: 'C-1004', kind: 'promise', at: '-4d@09:41', date: '-4d', method: null, outcomeCode: null, amount: null, promiseAmount: 120.00, promiseDate: '+0d', nextAction: null, notes: 'Promise to pay made in the customer portal.', repId: null, team: 'A', channel: 'portal', reference: 'PRM-3', templateId: null },
    { id: 'LOG-11', customerId: 'C-1004', kind: 'interaction', at: '-9d@13:20', date: '-9d', method: 'Phone', outcomeCode: 'REFUSED', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'Customer would not commit to a payment date.', repId: 'REP-02', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-12', customerId: 'C-1001', kind: 'interaction', at: '-12d@16:10', date: '-12d', method: 'Phone', outcomeCode: 'CB', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'Customer asked for a call back after payday.', repId: 'REP-01', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-13', customerId: 'C-1001', kind: 'payment', at: '-18d@15:20', date: '-18d', method: null, outcomeCode: null, amount: 50.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Portal payment received.', repId: null, team: 'A', channel: 'portal', reference: 'PMT-G7H8J9', templateId: null },
    { id: 'LOG-14', customerId: 'C-1005', kind: 'interaction', at: '-15d@10:45', date: '-15d', method: 'Phone', outcomeCode: 'WRONG', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Review account', notes: 'Someone else answered. No details given. Will try email.', repId: 'REP-01', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-15', customerId: 'C-1005', kind: 'interaction', at: '-2d@16:00', date: '-2d', method: 'Phone', outcomeCode: 'NA', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'No answer.', repId: 'REP-01', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-16', customerId: 'C-1006', kind: 'interaction', at: '-2d@09:50', date: '-2d', method: 'Phone', outcomeCode: 'HARD', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Escalate to team leader', notes: 'Customer reports reduced income. Hardship review needed.', repId: 'REP-02', team: 'A', channel: 'rep', reference: null, templateId: null },
    { id: 'LOG-17', customerId: 'C-1007', kind: 'reversal', at: '-19d@11:20', date: '-19d', method: null, outcomeCode: null, amount: 45.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Duplicate bank payment reversed (reason DUPLICATE). Balance corrected.', repId: 'TL-01', team: 'A', channel: 'rep', reference: 'PAY-11', templateId: null },
    { id: 'LOG-18', customerId: 'C-1007', kind: 'change', at: '-14d@09:04', date: '-14d', method: null, outcomeCode: null, amount: null, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Customer changed phone number in the portal.', repId: null, team: 'A', channel: 'portal', reference: null, templateId: null },
    { id: 'LOG-19', customerId: 'C-1007', kind: 'payment', at: '-9d@12:00', date: '-9d', method: null, outcomeCode: null, amount: 380.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Portal payment received. Balance cleared.', repId: null, team: 'A', channel: 'portal', reference: 'PMT-E5F6G7', templateId: null },
    { id: 'LOG-20', customerId: 'C-1009', kind: 'interaction', at: '-40d@14:00', date: '-40d', method: 'Phone', outcomeCode: 'PAID', amount: 60.00, promiseAmount: null, promiseDate: null, nextAction: 'No further action', notes: 'Card payment taken over the phone.', repId: 'REP-03', team: 'B', channel: 'rep', reference: 'PMT-L2M3N4', templateId: null },
    { id: 'LOG-21', customerId: 'C-1009', kind: 'interaction', at: '-14d@09:40', date: '-14d', method: 'Phone', outcomeCode: 'PTP', amount: null, promiseAmount: 100.00, promiseDate: '-10d', nextAction: 'Await promised payment', notes: 'Customer promised 100.00.', repId: 'REP-03', team: 'B', channel: 'rep', reference: 'PRM-6', templateId: null },
    { id: 'LOG-22', customerId: 'C-1009', kind: 'payment', at: '-11d@10:30', date: '-11d', method: null, outcomeCode: null, amount: 60.00, promiseAmount: null, promiseDate: null, nextAction: null, notes: 'Portal payment received.', repId: null, team: 'B', channel: 'portal', reference: 'PMT-P5Q6R7', templateId: null },
    { id: 'LOG-23', customerId: 'C-1009', kind: 'fulfilment', at: '-10d@06:00', date: '-10d', method: null, outcomeCode: null, amount: 60.00, promiseAmount: 100.00, promiseDate: '-10d', nextAction: null, notes: 'Partially fulfilled: promised 100.00, received 60.00, shortfall 40.00.', repId: null, team: 'B', channel: 'system', reference: 'PRM-6', templateId: null },
    { id: 'LOG-24', customerId: 'C-1009', kind: 'interaction', at: '-3d@10:15', date: '-3d', method: 'SMS', outcomeCode: 'NA', amount: null, promiseAmount: null, promiseDate: null, nextAction: 'Call back', notes: 'No reply to SMS.', repId: 'REP-03', team: 'B', channel: 'rep', reference: null, templateId: null }
  ],

  followups: [
    { id: 'FU-1', customerId: 'C-1008', ownerId: 'REP-02', dueDate: '+1d', time: '14:30', channel: 'Phone', status: 'Open', pausedUntil: null, sourceLogId: 'LOG-3', outcomeCode: 'NA', overrideReason: null, createdAt: '-1d@11:06', completedAt: null, reassignedFrom: null },
    { id: 'FU-2', customerId: 'C-1008', ownerId: 'REP-02', dueDate: '-2d', time: '15:00', channel: 'Phone', status: 'Open', pausedUntil: null, sourceLogId: 'LOG-2', outcomeCode: 'CB', overrideReason: null, createdAt: '-3d@15:41', completedAt: null, reassignedFrom: null },
    { id: 'FU-3', customerId: 'C-1001', ownerId: 'REP-01', dueDate: '-10d', time: '16:00', channel: 'Phone', status: 'Done', pausedUntil: null, sourceLogId: 'LOG-12', outcomeCode: 'CB', overrideReason: 'Customer asked for a call after payday', createdAt: '-12d@16:11', completedAt: '-10d@16:20', reassignedFrom: null },
    { id: 'FU-4', customerId: 'C-1006', ownerId: 'REP-01', dueDate: '+0d', time: '10:00', channel: 'Phone', status: 'Open', pausedUntil: null, sourceLogId: 'LOG-16', outcomeCode: 'HARD', overrideReason: null, createdAt: '-2d@09:51', completedAt: null, reassignedFrom: 'REP-02' },
    { id: 'FU-5', customerId: 'C-1004', ownerId: 'REP-02', dueDate: '-2d', time: '13:00', channel: 'Phone', status: 'Paused', pausedUntil: '+0d', sourceLogId: 'LOG-11', outcomeCode: 'REFUSED', overrideReason: null, createdAt: '-9d@13:21', completedAt: null, reassignedFrom: null },
    { id: 'FU-6', customerId: 'C-1009', ownerId: 'REP-03', dueDate: '-1d', time: '09:30', channel: 'SMS', status: 'Open', pausedUntil: null, sourceLogId: 'LOG-24', outcomeCode: 'NA', overrideReason: null, createdAt: '-3d@10:16', completedAt: null, reassignedFrom: null },
    { id: 'FU-7', customerId: 'C-1005', ownerId: 'REP-01', dueDate: '+0d', time: '14:00', channel: 'Phone', status: 'Open', pausedUntil: null, sourceLogId: 'LOG-15', outcomeCode: 'NA', overrideReason: null, createdAt: '-2d@16:01', completedAt: null, reassignedFrom: null },
    { id: 'FU-8', customerId: 'C-1003', ownerId: 'REP-01', dueDate: '-3d', time: '18:00', channel: 'Phone', status: 'Done', pausedUntil: null, sourceLogId: 'LOG-8', outcomeCode: 'PTP', overrideReason: null, createdAt: '-6d@14:31', completedAt: '-2d@10:15', reassignedFrom: null }
  ],

  audit: [
    { id: 'AUD-1', at: '-60d@10:00', userId: 'COM-01', userLabel: 'Colm Reilly (Compliance)', channel: 'staff', entity: 'template', entityId: 'TPL-1', customerId: null, action: 'approve', before: { status: 'Pending' }, after: { status: 'Approved' }, note: 'Reminder template version 1 approved' },
    { id: 'AUD-2', at: '-20d@10:30', userId: 'TL-01', userLabel: 'Priya Nair (Team leader)', channel: 'staff', entity: 'setting', entityId: 'reminderDaysBefore', customerId: null, action: 'update', before: { value: 5 }, after: { value: 3 }, note: 'Existing scheduled reminders keep their timing' },
    { id: 'AUD-3', at: '-19d@11:20', userId: 'TL-01', userLabel: 'Priya Nair (Team leader)', channel: 'staff', entity: 'payment', entityId: 'PAY-11', customerId: 'C-1007', action: 'reversal', before: { status: 'success' }, after: { status: 'reversed' }, note: 'Reason code DUPLICATE' },
    { id: 'AUD-4', at: '-14d@09:04', userId: 'C-1007', userLabel: 'Customer 100007', channel: 'portal', entity: 'customer', entityId: 'C-1007', customerId: 'C-1007', action: 'update-contact', before: { phone: '07700900201' }, after: { phone: '07700900107' }, note: 'Customer-made change' },
    { id: 'AUD-5', at: '-12d@16:08', userId: 'REP-01', userLabel: 'Sam Patel (Rep)', channel: 'staff', entity: 'verification', entityId: 'VER-9', customerId: 'C-1001', action: 'verify', before: null, after: { method: 'phone', outcome: 'Verified' }, note: 'Phone verification of caller' },
    { id: 'AUD-6', at: '-6d@14:30', userId: 'REP-01', userLabel: 'Sam Patel (Rep)', channel: 'staff', entity: 'promise', entityId: 'PRM-2', customerId: 'C-1003', action: 'create', before: null, after: { amount: 200.00, dueDate: '+0d', source: 'rep', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-7', at: '-5d@10:14', userId: 'C-1002', userLabel: 'Customer 100002', channel: 'portal', entity: 'verification', entityId: 'VER-1', customerId: 'C-1002', action: 'verify', before: null, after: { method: 'portal', outcome: 'Verified' }, note: 'Portal verification' },
    { id: 'AUD-8', at: '-5d@10:16', userId: 'C-1002', userLabel: 'Customer 100002', channel: 'portal', entity: 'promise', entityId: 'PRM-1', customerId: 'C-1002', action: 'create', before: null, after: { amount: 150.00, dueDate: '+0d', source: 'portal', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-9', at: '-4d@09:41', userId: 'C-1004', userLabel: 'Customer 100004', channel: 'portal', entity: 'promise', entityId: 'PRM-3', customerId: 'C-1004', action: 'create', before: null, after: { amount: 120.00, dueDate: '+0d', source: 'portal', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-10', at: '-4d@17:02', userId: 'C-1005', userLabel: 'Customer 100005', channel: 'portal', entity: 'payment', entityId: 'PAY-9', customerId: 'C-1005', action: 'payment-failed', before: null, after: { amount: 60.00, status: 'failed', reasonCategory: 'Provider timeout' }, note: 'Portal payment attempt' },
    { id: 'AUD-11', at: '-3d@13:40', userId: 'C-1002', userLabel: 'Customer 100002', channel: 'portal', entity: 'payment', entityId: 'PAY-4', customerId: 'C-1002', action: 'payment-success', before: null, after: { amount: 150.00, reference: 'PMT-K1L2M3', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-12', at: '-2d@19:30', userId: 'C-1008', userLabel: 'Customer 100008', channel: 'portal', entity: 'customer', entityId: 'C-1008', customerId: 'C-1008', action: 'update-reminder-prefs', before: { optedOut: false }, after: { optedOut: true }, note: 'Customer opted out of reminders' },
    { id: 'AUD-13', at: '-2d@09:45', userId: 'COM-01', userLabel: 'Colm Reilly (Compliance)', channel: 'staff', entity: 'template', entityId: 'TPL-2', customerId: null, action: 'create', before: null, after: { version: 2, status: 'Pending' }, note: 'New reminder wording awaiting approval' },
    { id: 'AUD-14', at: '-1d@08:17', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'customer', entityId: 'C-1006', customerId: 'C-1006', action: 'lockout', before: { locked: false }, after: { locked: true }, note: 'Locked after 3 failed portal verifications' },
    { id: 'AUD-15', at: '-1d@09:20', userId: 'TL-01', userLabel: 'Priya Nair (Team leader)', channel: 'staff', entity: 'followup', entityId: 'FU-4', customerId: 'C-1006', action: 'reassign', before: { ownerId: 'REP-02' }, after: { ownerId: 'REP-01' }, note: 'Reassigned to balance workload' },
    { id: 'AUD-16', at: '-40d@11:10', userId: 'REP-01', userLabel: 'Sam Patel (Rep)', channel: 'staff', entity: 'payment', entityId: 'PAY-1', customerId: 'C-1001', action: 'payment-success', before: null, after: { amount: 100.00, reference: 'PMT-A1B2C3', channel: 'phone' }, note: 'Phone payment' },
    { id: 'AUD-17', at: '-22d@18:45', userId: 'C-1001', userLabel: 'Customer 100001', channel: 'portal', entity: 'payment', entityId: 'PAY-2', customerId: 'C-1001', action: 'payment-success', before: null, after: { amount: 80.00, reference: 'PMT-D4E5F6', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-18', at: '-18d@15:20', userId: 'C-1001', userLabel: 'Customer 100001', channel: 'portal', entity: 'payment', entityId: 'PAY-3', customerId: 'C-1001', action: 'payment-success', before: null, after: { amount: 50.00, reference: 'PMT-G7H8J9', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-19', at: '-30d@10:05', userId: 'REP-01', userLabel: 'Sam Patel (Rep)', channel: 'staff', entity: 'payment', entityId: 'PAY-5', customerId: 'C-1003', action: 'payment-success', before: null, after: { amount: 160.00, reference: 'PMT-N4P5Q6', channel: 'phone' }, note: 'Phone payment' },
    { id: 'AUD-20', at: '-2d@10:11', userId: 'C-1003', userLabel: 'Customer 100003', channel: 'portal', entity: 'payment', entityId: 'PAY-6', customerId: 'C-1003', action: 'payment-success', before: null, after: { amount: 80.00, reference: 'PMT-R7S8T9', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-21', at: '-35d@09:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'payment', entityId: 'PAY-7', customerId: 'C-1004', action: 'payment-success', before: null, after: { amount: 110.00, reference: 'PMT-U1V2W3', channel: 'bank' }, note: 'Bank transfer matched' },
    { id: 'AUD-22', at: '-28d@09:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'payment', entityId: 'PAY-8', customerId: 'C-1005', action: 'payment-success', before: null, after: { amount: 60.00, reference: 'PMT-X4Y5Z6', channel: 'bank' }, note: 'Bank transfer matched' },
    { id: 'AUD-23', at: '-9d@12:00', userId: 'C-1007', userLabel: 'Customer 100007', channel: 'portal', entity: 'payment', entityId: 'PAY-10', customerId: 'C-1007', action: 'payment-success', before: null, after: { amount: 380.00, reference: 'PMT-E5F6G7', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-24', at: '-20d@09:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'payment', entityId: 'PAY-11', customerId: 'C-1007', action: 'payment-success', before: null, after: { amount: 45.00, reference: 'PMT-H8J9K1', channel: 'bank' }, note: 'Bank transfer matched' },
    { id: 'AUD-25', at: '-40d@14:05', userId: 'REP-03', userLabel: 'Lee Chen (Rep)', channel: 'staff', entity: 'payment', entityId: 'PAY-12', customerId: 'C-1009', action: 'payment-success', before: null, after: { amount: 60.00, reference: 'PMT-L2M3N4', channel: 'phone' }, note: 'Phone payment' },
    { id: 'AUD-26', at: '-11d@10:30', userId: 'C-1009', userLabel: 'Customer 100009', channel: 'portal', entity: 'payment', entityId: 'PAY-13', customerId: 'C-1009', action: 'payment-success', before: null, after: { amount: 60.00, reference: 'PMT-P5Q6R7', channel: 'portal' }, note: 'Portal payment' },
    { id: 'AUD-27', at: '-25d@11:00', userId: 'C-1001', userLabel: 'Customer 100001', channel: 'portal', entity: 'promise', entityId: 'PRM-4', customerId: 'C-1001', action: 'create', before: null, after: { amount: 130.00, dueDate: '-18d', source: 'portal', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-28', at: '-20d@13:10', userId: 'C-1008', userLabel: 'Customer 100008', channel: 'portal', entity: 'promise', entityId: 'PRM-5', customerId: 'C-1008', action: 'create', before: null, after: { amount: 90.00, dueDate: '-9d', source: 'portal', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-29', at: '-14d@09:40', userId: 'REP-03', userLabel: 'Lee Chen (Rep)', channel: 'staff', entity: 'promise', entityId: 'PRM-6', customerId: 'C-1009', action: 'create', before: null, after: { amount: 100.00, dueDate: '-10d', source: 'rep', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-30', at: '-14d@16:20', userId: 'C-1003', userLabel: 'Customer 100003', channel: 'portal', entity: 'promise', entityId: 'PRM-7', customerId: 'C-1003', action: 'create', before: null, after: { amount: 250.00, dueDate: '+4d', source: 'portal', verificationResult: 'Verified', status: 'Active' }, note: 'Verification: Verified' },
    { id: 'AUD-31', at: '-6d@14:30', userId: 'REP-01', userLabel: 'Sam Patel (Rep)', channel: 'staff', entity: 'promise', entityId: 'PRM-7', customerId: 'C-1003', action: 'supersede', before: { status: 'Active' }, after: { status: 'Superseded', supersededBy: 'PRM-2' }, note: 'Replaced by promise PRM-2.' },
    { id: 'AUD-32', at: '-18d@16:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'promise', entityId: 'PRM-4', customerId: 'C-1001', action: 'fulfilment-check', before: { status: 'Active' }, after: { status: 'Fulfilled', received: 130.00, shortfall: 0 }, note: 'Automatic fulfilment check.' },
    { id: 'AUD-33', at: '-10d@06:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'promise', entityId: 'PRM-6', customerId: 'C-1009', action: 'fulfilment-check', before: { status: 'Active' }, after: { status: 'Partially fulfilled', received: 60.00, shortfall: 40.00 }, note: 'Automatic fulfilment check.' },
    { id: 'AUD-34', at: '-9d@06:00', userId: 'SYSTEM', userLabel: 'System', channel: 'system', entity: 'promise', entityId: 'PRM-5', customerId: 'C-1008', action: 'fulfilment-check', before: { status: 'Active' }, after: { status: 'Not fulfilled', received: 0, shortfall: 90.00 }, note: 'Automatic fulfilment check.' }
  ],

  verifications: [
    { id: 'VER-1', at: '-5d@10:14', accountNo: '100002', customerId: 'C-1002', method: 'portal', actorId: null, outcome: 'Verified' },
    { id: 'VER-2', at: '-6d@14:25', accountNo: '100003', customerId: 'C-1003', method: 'phone', actorId: 'REP-01', outcome: 'Verified' },
    { id: 'VER-3', at: '-4d@09:38', accountNo: '100004', customerId: 'C-1004', method: 'portal', actorId: null, outcome: 'Verified' },
    { id: 'VER-4', at: '-3d@13:30', accountNo: '100002', customerId: 'C-1002', method: 'portal', actorId: null, outcome: 'Verified' },
    { id: 'VER-5', at: '-2d@10:05', accountNo: '100003', customerId: 'C-1003', method: 'portal', actorId: null, outcome: 'Verified' },
    { id: 'VER-6', at: '-1d@08:15', accountNo: '100006', customerId: 'C-1006', method: 'portal', actorId: null, outcome: 'Not verified' },
    { id: 'VER-7', at: '-1d@08:16', accountNo: '100006', customerId: 'C-1006', method: 'portal', actorId: null, outcome: 'Not verified' },
    { id: 'VER-8', at: '-1d@08:17', accountNo: '100006', customerId: 'C-1006', method: 'portal', actorId: null, outcome: 'Locked' },
    { id: 'VER-9', at: '-12d@16:08', accountNo: '100001', customerId: 'C-1001', method: 'phone', actorId: 'REP-01', outcome: 'Verified' },
    { id: 'VER-10', at: '-14d@09:35', accountNo: '100009', customerId: 'C-1009', method: 'phone', actorId: 'REP-03', outcome: 'Verified' },
    { id: 'VER-11', at: '-15d@10:40', accountNo: '100005', customerId: 'C-1005', method: 'phone', actorId: 'REP-01', outcome: 'Not verified' },
    { id: 'VER-12', at: '-5d@09:25', accountNo: '100008', customerId: 'C-1008', method: 'phone', actorId: 'REP-02', outcome: 'Verified' }
  ],

  messages: [
    { id: 'MSG-1', at: '-27d@06:10', customerId: 'C-1001', to: 'alex.hartley@example.com', channel: 'email', kind: 'reminder', templateId: 'TPL-1', subject: 'Payment reminder', body: 'Hello Alex, your payment of 520.00 is due soon. You can pay online or contact us if you need help. To change or stop reminders, use the preferences link.', status: 'sent', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Unsubscribe / preferences', href: 'portal-preferences.html?t=k7Qp2xVd9M' }] },
    { id: 'MSG-2', at: '-18d@15:21', customerId: 'C-1001', to: 'alex.hartley@example.com', channel: 'email', kind: 'payment-confirmation', templateId: 'TPL-3', subject: 'Payment received', body: 'Hello Alex, we received your payment of 50.00. Your reference is PMT-G7H8J9. Thank you.', status: 'delivered', links: [{ label: 'View my account', href: 'portal-account.html' }] },
    { id: 'MSG-3', at: '-3d@13:41', customerId: 'C-1002', to: 'maya.thompson@example.com', channel: 'email', kind: 'payment-confirmation', templateId: 'TPL-3', subject: 'Payment received', body: 'Hello Maya, we received your payment of 150.00. Your reference is PMT-K1L2M3. Thank you.', status: 'delivered', links: [{ label: 'View my account', href: 'portal-account.html' }] },
    { id: 'MSG-4', at: '-2d@10:12', customerId: 'C-1003', to: 'daniel.okoye@example.com', channel: 'email', kind: 'payment-confirmation', templateId: 'TPL-3', subject: 'Payment received', body: 'Hello Daniel, we received your payment of 80.00. Your reference is PMT-R7S8T9. Thank you.', status: 'delivered', links: [{ label: 'View my account', href: 'portal-account.html' }] },
    { id: 'MSG-5', at: '-27d@06:10', customerId: 'C-1005', to: 'jamie.carter@example.com', channel: 'email', kind: 'reminder', templateId: 'TPL-1', subject: 'Payment reminder', body: 'Hello Jamie, your payment of 300.00 is due soon. You can pay online or contact us if you need help. To change or stop reminders, use the preferences link.', status: 'bounced', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Unsubscribe / preferences', href: 'portal-preferences.html?t=q4WvN8rGt1' }] },
    { id: 'MSG-6', at: '-26d@06:10', customerId: 'C-1006', to: 'fatima.rahman@example.com', channel: 'email', kind: 'reminder', templateId: 'TPL-1', subject: 'Payment reminder', body: 'Hello Fatima, your payment of 700.00 is due soon. You can pay online or contact us if you need help. To change or stop reminders, use the preferences link.', status: 'failed', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Unsubscribe / preferences', href: 'portal-preferences.html?t=Hd5Lz3Bc9y' }] },
    { id: 'MSG-7', at: '-27d@06:10', customerId: 'C-1009', to: '07700900109', channel: 'sms', kind: 'reminder', templateId: 'TPL-7', subject: '', body: 'Reminder: you have a payment due. Sign in to see details: portal-verify.html', status: 'delivered', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Unsubscribe / preferences', href: 'portal-preferences.html?t=w1Kc6Fh5Zs' }] },
    { id: 'MSG-8', at: '-6d@06:10', customerId: 'C-1008', to: 'sophie.walker@example.com', channel: 'email', kind: 'reminder', templateId: 'TPL-1', subject: 'Payment reminder', body: 'Hello Sophie, your payment of 450.00 is due soon. You can pay online or contact us if you need help. To change or stop reminders, use the preferences link.', status: 'delivered', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Unsubscribe / preferences', href: 'portal-preferences.html?t=R8gYp4Tn3J' }] },
    { id: 'MSG-9', at: '-9d@06:35', customerId: 'C-1008', to: 'sophie.walker@example.com', channel: 'email', kind: 'missing-payment', templateId: 'TPL-4', subject: 'We have not received your payment', body: 'Hello Sophie, we expected a payment of 90.00 but have not received it. Please pay online, or contact your collections rep to talk through your options.', status: 'delivered', links: [{ label: 'Pay now', href: 'portal-pay.html' }, { label: 'Contact your rep: 0800 000 000', href: 'portal-account.html' }] },
    { id: 'MSG-10', at: '-14d@09:05', customerId: 'C-1007', to: '07700900201', channel: 'sms', kind: 'previous-contact', templateId: 'TPL-6', subject: '', body: 'Hello Oliver, the phone number on your account was changed. If you made this change, no action is needed. If you did not, report it straight away: call 0800 000 000 and say it was an unauthorised change.', status: 'delivered', links: [{ label: 'Report an unauthorised change', href: 'portal-details.html' }] },
    { id: 'MSG-11', at: '-19d@11:25', customerId: 'C-1007', to: 'oliver.grant@example.com', channel: 'email', kind: 'reversal', templateId: 'TPL-8', subject: 'A payment was reversed', body: 'Hello Oliver, a payment of 45.00 on your account was reversed. Your balance has been corrected. Reference PMT-H8J9K1.', status: 'delivered', links: [{ label: 'View my account', href: 'portal-account.html' }] }
  ],

  jobRuns: [
    { id: 'JOB-1', job: 'reminders', startedAt: '-27d@06:10', endedAt: '-27d@06:11', processed: 3, status: 'success', attempt: 1, note: '3 reminders sent' },
    { id: 'JOB-2', job: 'reminders', startedAt: '-26d@06:10', endedAt: '-26d@06:11', processed: 1, status: 'success', attempt: 1, note: '1 reminder sent' },
    { id: 'JOB-3', job: 'fulfilment-check', startedAt: '-18d@16:00', endedAt: '-18d@16:01', processed: 1, status: 'success', attempt: 1, note: '1 promise due: Fulfilled' },
    { id: 'JOB-4', job: 'fulfilment-check', startedAt: '-10d@06:00', endedAt: '-10d@06:01', processed: 1, status: 'success', attempt: 1, note: '1 promise due: Partially fulfilled' },
    { id: 'JOB-5', job: 'fulfilment-check', startedAt: '-9d@06:00', endedAt: '-9d@06:01', processed: 1, status: 'success', attempt: 1, note: '1 promise due: Not fulfilled' },
    { id: 'JOB-6', job: 'reminders', startedAt: '-6d@06:10', endedAt: '-6d@06:11', processed: 1, status: 'success', attempt: 1, note: '1 reminder sent' },
    { id: 'JOB-7', job: 'fulfilment-check', startedAt: '-3d@06:00', endedAt: '-3d@06:02', processed: 0, status: 'retried', attempt: 1, note: 'Data source timeout. Retry scheduled.' },
    { id: 'JOB-8', job: 'fulfilment-check', startedAt: '-3d@06:05', endedAt: '-3d@06:06', processed: 0, status: 'success', attempt: 2, note: 'Succeeded on retry. No promises due.' },
    { id: 'JOB-9', job: 'fulfilment-check', startedAt: '-1d@06:00', endedAt: '-1d@06:01', processed: 0, status: 'success', attempt: 1, note: 'No promises due' }
  ],

  alerts: [
    { id: 'ALT-1', at: '-26d@06:12', type: 'reminder-failure-rate', severity: 'medium', detail: 'Reminder failure rate 50% over the period exceeded the 10% threshold (bounced and failed deliveries).', acknowledged: true },
    { id: 'ALT-2', at: '-3d@06:02', type: 'job-failed', severity: 'high', detail: 'Fulfilment check failed on attempt 1. Retried automatically and succeeded on attempt 2.', acknowledged: true },
    { id: 'ALT-3', at: '-1d@08:17', type: 'lockout', severity: 'medium', detail: 'Account 100006 locked after 3 failed portal verifications.', acknowledged: false },
    { id: 'ALT-4', at: '-1d@12:00', type: 'display-mismatch', severity: 'medium', detail: 'Account page for C-1003 showed a different balance from the source record.', acknowledged: false }
  ],

  settlements: [
    { id: 'SET-1', date: '-39d', providerRef: 'PRV-A1001', amount: 100.00, matchedPaymentId: 'PAY-1' },
    { id: 'SET-2', date: '-39d', providerRef: 'PRV-A1002', amount: 60.00, matchedPaymentId: 'PAY-12' },
    { id: 'SET-3', date: '-34d', providerRef: 'PRV-A1003', amount: 110.00, matchedPaymentId: 'PAY-7' },
    { id: 'SET-4', date: '-29d', providerRef: 'PRV-A1004', amount: 160.00, matchedPaymentId: 'PAY-5' },
    { id: 'SET-5', date: '-27d', providerRef: 'PRV-A1005', amount: 60.00, matchedPaymentId: 'PAY-8' },
    { id: 'SET-6', date: '-21d', providerRef: 'PRV-A1006', amount: 80.00, matchedPaymentId: 'PAY-2' },
    { id: 'SET-7', date: '-17d', providerRef: 'PRV-A1007', amount: 50.00, matchedPaymentId: 'PAY-3' },
    { id: 'SET-8', date: '-10d', providerRef: 'PRV-A1008', amount: 60.00, matchedPaymentId: 'PAY-13' },
    { id: 'SET-9', date: '-8d', providerRef: 'PRV-A1009', amount: 380.00, matchedPaymentId: 'PAY-10' },
    { id: 'SET-10', date: '-3d', providerRef: 'PRV-A1010', amount: 60.00, matchedPaymentId: null },
    { id: 'SET-11', date: '-1d', providerRef: 'PRV-A1011', amount: 80.00, matchedPaymentId: 'PAY-6' }
  ],

  reminderSchedule: [
    { id: 'RSC-1', customerId: 'C-1001', dueDate: '+3d', daysBefore: 3, sendDate: '+0d', sent: false },
    { id: 'RSC-2', customerId: 'C-1005', dueDate: '+3d', daysBefore: 3, sendDate: '+0d', sent: false },
    { id: 'RSC-3', customerId: 'C-1006', dueDate: '+5d', daysBefore: 5, sendDate: '+0d', sent: false },
    { id: 'RSC-4', customerId: 'C-1007', dueDate: '+3d', daysBefore: 3, sendDate: '+0d', sent: false },
    { id: 'RSC-5', customerId: 'C-1008', dueDate: '+3d', daysBefore: 3, sendDate: '+0d', sent: false },
    { id: 'RSC-6', customerId: 'C-1009', dueDate: '+3d', daysBefore: 3, sendDate: '+0d', sent: false },
    { id: 'RSC-7', customerId: 'C-1002', dueDate: '+14d', daysBefore: 3, sendDate: '+11d', sent: false },
    { id: 'RSC-8', customerId: 'C-1004', dueDate: '+9d', daysBefore: 3, sendDate: '+6d', sent: false },
    { id: 'RSC-9', customerId: 'C-1003', dueDate: '+21d', daysBefore: 3, sendDate: '+18d', sent: false }
  ],

  queries: [
    { id: 'QRY-1', customerId: 'C-1005', at: '-4d@17:30', expectedDate: '-4d', expectedAmount: 60.00, status: 'Open' },
    { id: 'QRY-2', customerId: 'C-1009', at: '-12d@09:00', expectedDate: '-12d', expectedAmount: 60.00, status: 'Resolved' },
    { id: 'QRY-3', customerId: 'C-1001', at: '-23d@19:10', expectedDate: '-23d', expectedAmount: 80.00, status: 'Resolved' }
  ],

  reversals: [
    { id: 'REV-1', paymentId: 'PAY-11', customerId: 'C-1007', amount: 45.00, reasonCode: 'DUPLICATE', approvedBy: 'TL-01', at: '-19d@11:20' }
  ],

  accountViews: [
    { id: 'VIEW-1', at: '-2d@09:12', customerId: 'C-1001', displayed: { balance: 420.00, dueDate: '+3d', paymentCount: 3 }, source: { balance: 420.00, dueDate: '+3d', paymentCount: 3 } },
    { id: 'VIEW-2', at: '-3d@13:50', customerId: 'C-1002', displayed: { balance: 350.00, dueDate: '+14d', paymentCount: 1 }, source: { balance: 350.00, dueDate: '+14d', paymentCount: 1 } },
    { id: 'VIEW-3', at: '-1d@11:55', customerId: 'C-1003', displayed: { balance: 640.00, dueDate: '+21d', paymentCount: 1 }, source: { balance: 560.00, dueDate: '+21d', paymentCount: 2 } },
    { id: 'VIEW-4', at: '-1d@16:00', customerId: 'C-1009', displayed: { balance: 400.00, dueDate: '+3d', paymentCount: 2 }, source: { balance: 400.00, dueDate: '+3d', paymentCount: 2 } },
    { id: 'VIEW-5', at: '-8d@12:10', customerId: 'C-1007', displayed: { balance: 0.00, dueDate: '+3d', paymentCount: 1 }, source: { balance: 0.00, dueDate: '+3d', paymentCount: 1 } },
    { id: 'VIEW-6', at: '-4d@16:55', customerId: 'C-1005', displayed: { balance: 240.00, dueDate: '+3d', paymentCount: 1 }, source: { balance: 240.00, dueDate: '+3d', paymentCount: 1 } }
  ],

  accessAttempts: [
    { id: 'ACC-1', at: '-7d@10:20', role: 'rep', userId: 'REP-01', pageId: 'staff-approvals', result: 'denied' },
    { id: 'ACC-2', at: '-5d@14:02', role: 'customer', userId: null, pageId: 'staff-search', result: 'denied' },
    { id: 'ACC-3', at: '-3d@09:44', role: 'rep', userId: 'REP-03', pageId: 'report-balances-arrears', result: 'denied' },
    { id: 'ACC-4', at: '-2d@15:30', role: 'finance', userId: 'FIN-01', pageId: 'staff-record', result: 'denied' },
    { id: 'ACC-5', at: '-1d@13:12', role: 'compliance', userId: 'COM-01', pageId: 'jobs', result: 'denied' }
  ],

  apiRequests: [
    { id: 'API-1', at: '-3d@13:50', sessionCustomerId: 'C-1002', method: 'GET', path: '/api/me/account', status: 200, note: 'Own record returned (read-only)' },
    { id: 'API-2', at: '-3d@13:52', sessionCustomerId: 'C-1002', method: 'GET', path: '/api/customers/C-1003/account', status: 403, note: 'Another customer\'s record refused and logged' },
    { id: 'API-3', at: '-2d@09:12', sessionCustomerId: 'C-1001', method: 'GET', path: '/api/me/account', status: 200, note: 'Own record returned (read-only)' },
    { id: 'API-4', at: '-2d@09:14', sessionCustomerId: 'C-1001', method: 'PUT', path: '/api/me/account', status: 405, note: 'Write refused: the interface is read-only' },
    { id: 'API-5', at: '-1d@16:00', sessionCustomerId: 'C-1009', method: 'GET', path: '/api/me/account', status: 200, note: 'Own record returned (read-only)' }
  ],

  migration: {
    legacyTotal: 1250,
    migrated: 1245,
    exceptions: [
      { legacyId: 'LEG-00412', type: 'Unmigrated', detail: 'Account has no valid account number', resolution: 'Pending manual review' },
      { legacyId: 'LEG-00877', type: 'Unmigrated', detail: 'Customer record missing a date of birth', resolution: 'Pending manual review' },
      { legacyId: 'LEG-01190', type: 'Unmigrated', detail: 'Corrupt balance field', resolution: 'Source record being repaired' },
      { legacyId: 'LEG-00233', type: 'Duplicate merged', detail: 'Same name, date of birth and postcode as LEG-00231', resolution: 'Merged into LEG-00231' },
      { legacyId: 'LEG-00954', type: 'Duplicate merged', detail: 'Same account number entered twice', resolution: 'Merged into LEG-00953' },
      { legacyId: 'LEG-01022', type: 'Duplicate flagged', detail: 'Similar name and address to LEG-01019, different date of birth', resolution: 'Both kept, flagged for review' },
      { legacyId: 'LEG-00618', type: 'Type mismatch', detail: 'Balance stored as text', resolution: 'Converted to a number' },
      { legacyId: 'LEG-00731', type: 'Type mismatch', detail: 'Due date stored as day/month text', resolution: 'Converted to an ISO date' }
    ]
  }
};
