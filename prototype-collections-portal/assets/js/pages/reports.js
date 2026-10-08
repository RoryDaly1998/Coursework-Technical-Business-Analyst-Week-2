/* reports.html page script: reads ?r=, applies the role guard for that report, then renders it (or the role's report index). */
(function () {
  'use strict';

  var el = UI.el;
  var id = UI.query('r');

  // Shows an error followed by the role's report index.
  function showError(main, message) {
    main.appendChild(el('div', { class: 'notice notice--error' }, [message]));
    var index = el('div', { class: 'stack' });
    main.appendChild(el('h2', null, ['Available reports']));
    main.appendChild(index);
    Reports.renderIndex(index);
  }

  if (!id) {
    Layout.ready(function (main) { Reports.renderIndex(main); });
    Layout.init('reports');
  } else if (!Auth.page('report-' + id)) {
    Layout.ready(function (main) { showError(main, 'Unknown report "' + id + '". Choose one of the reports below.'); });
    Layout.init('reports');
  } else {
    Layout.ready(function (main) {
      if (!Reports.has(id)) {
        showError(main, 'The definition for report "' + id + '" has not been loaded. Check that its reports-*.js file exists and is listed in reports.html.');
        return;
      }
      Reports.render(id, main);
    });
    Layout.init('report-' + id);
  }
})();
