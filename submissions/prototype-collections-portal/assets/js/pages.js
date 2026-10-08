/*
 * PAGES registry: the only place that defines page access, nav grouping and story tags.
 *
 * Entry: { id, file, title, group:'Customer'|'Staff'|'Reports'|'Admin', roles:[...],
 *          needsVerified:bool, stories:[...], reportId?, hideInNav? }
 *
 * - needsVerified is enforced by Layout for the customer role only.
 * - hideInNav entries (index) are reachable but not listed in the nav or site map.
 * - Report pages have id 'report-<reportId>' and file 'reports.html?r=<reportId>'.
 * - Nav order for a role follows the order of this array within each group.
 */
(function () {
  'use strict';

  var ALL = ['customer', 'rep', 'leader', 'finance', 'compliance', 'it'];

  // Builds a report entry so ids and files stay consistent.
  function report(reportId, title, roles, stories) {
    return {
      id: 'report-' + reportId,
      file: 'reports.html?r=' + reportId,
      title: title,
      group: 'Reports',
      roles: roles,
      needsVerified: false,
      stories: stories,
      reportId: reportId
    };
  }

  window.PAGES = [
    // Hidden entries
    { id: 'index', file: 'index.html', title: 'Home: Collections Portal', group: 'Admin', roles: ALL, needsVerified: false, stories: [], hideInNav: true },
    { id: 'demo', file: 'demo.html', title: 'Demo Guide & Tools', group: 'Admin', roles: ALL, needsVerified: false, stories: [], hideInNav: true },
    { id: 'reports', file: 'reports.html', title: 'All reports', group: 'Reports', roles: ['leader', 'finance', 'compliance', 'it'], needsVerified: false, stories: [] },

    // Customer portal
    { id: 'portal-verify', file: 'portal-verify.html', title: 'Verify your identity', group: 'Customer', roles: ['customer'], needsVerified: false, stories: ['US-19', 'US-20', 'US-23'] },
    { id: 'portal-account', file: 'portal-account.html', title: 'My account', group: 'Customer', roles: ['customer'], needsVerified: true, stories: ['US-28', 'US-40', 'US-41', 'US-42'] },
    { id: 'portal-pay', file: 'portal-pay.html', title: 'Make a payment', group: 'Customer', roles: ['customer'], needsVerified: true, stories: ['US-12', 'US-13', 'US-14'] },
    { id: 'portal-promise', file: 'portal-promise.html', title: 'Promise to pay', group: 'Customer', roles: ['customer'], needsVerified: true, stories: ['US-35', 'US-36'] },
    { id: 'portal-details', file: 'portal-details.html', title: 'Update my details', group: 'Customer', roles: ['customer'], needsVerified: true, stories: ['US-43', 'US-44', 'US-45'] },
    { id: 'portal-preferences', file: 'portal-preferences.html', title: 'Reminder preferences', group: 'Customer', roles: ['customer'], needsVerified: false, stories: ['US-49'] },
    { id: 'outbox', file: 'outbox.html', title: 'Outbox', group: 'Customer', roles: ['customer', 'rep', 'leader', 'it'], needsVerified: true, stories: ['US-13', 'US-28', 'US-36', 'US-45', 'US-48', 'US-49'] },

    // Staff workspace
    { id: 'staff-search', file: 'staff-search.html', title: 'Customer search', group: 'Staff', roles: ['rep', 'leader'], needsVerified: false, stories: ['US-03'] },
    { id: 'staff-record', file: 'staff-record.html', title: 'Customer record', group: 'Staff', roles: ['rep', 'leader'], needsVerified: false, stories: ['US-03', 'US-05', 'US-07', 'US-15', 'US-21', 'US-23', 'US-25', 'US-34', 'US-37', 'US-43', 'US-46', 'US-50'] },
    { id: 'staff-log', file: 'staff-log.html', title: 'Log an interaction', group: 'Staff', roles: ['rep'], needsVerified: false, stories: ['US-08', 'US-30', 'US-33', 'US-34'] },
    { id: 'staff-followups', file: 'staff-followups.html', title: 'Follow-ups', group: 'Staff', roles: ['rep', 'leader'], needsVerified: false, stories: ['US-31', 'US-32'] },
    { id: 'staff-approvals', file: 'staff-approvals.html', title: 'Reversal approvals', group: 'Staff', roles: ['leader'], needsVerified: false, stories: ['US-18'] },

    // Leader reports and controls
    { id: 'reminders-config', file: 'reminders-config.html', title: 'Reminder timing', group: 'Admin', roles: ['leader'], needsVerified: false, stories: ['US-51'] },
    report('team-logs', 'Team interaction logs', ['leader'], ['US-09']),
    report('unfulfilled-promises', 'Unfulfilled promises', ['leader'], ['US-26']),

    // Finance reports
    report('balances-arrears', 'Balances and arrears', ['finance'], ['US-06']),
    report('outcomes', 'Outcome codes', ['finance'], ['US-11']),
    report('reconciliation', 'Payment reconciliation', ['finance'], ['US-16']),
    report('fulfilment-value', 'Promise fulfilment value', ['finance'], ['US-27']),
    report('promise-forecast', 'Promise forecast', ['finance'], ['US-38']),

    // Compliance
    report('audit-trail', 'Audit trail', ['compliance'], ['US-04', 'US-39', 'US-47']),
    report('log-export', 'Interaction log export', ['compliance'], ['US-10']),
    report('verification-log', 'Verification log', ['compliance'], ['US-22']),
    report('payment-audit', 'Payment audit', ['compliance'], ['US-17']),
    report('display-sampling', 'Display sampling check', ['compliance'], ['US-42']),
    report('followup-history', 'Follow-up history', ['compliance'], ['US-33']),
    { id: 'compliance-settings', file: 'compliance-settings.html', title: 'Compliance settings', group: 'Admin', roles: ['compliance'], needsVerified: false, stories: ['US-33', 'US-52'] },

    // IT
    report('migration-exceptions', 'Migration exceptions', ['it'], ['US-01']),
    report('security-status', 'Security status', ['it'], ['US-02']),
    report('lockouts-alerts', 'Lockouts and alerts', ['it'], ['US-23']),
    report('reminder-delivery', 'Reminder delivery', ['it'], ['US-53']),
    { id: 'jobs', file: 'jobs.html', title: 'Scheduled jobs', group: 'Admin', roles: ['it'], needsVerified: false, stories: ['US-24', 'US-29', 'US-48', 'US-50', 'US-52', 'US-53'] },
    { id: 'api-demo', file: 'api-demo.html', title: 'Read-only data interface', group: 'Admin', roles: ['it'], needsVerified: false, stories: ['US-40'] }
  ];
})();
