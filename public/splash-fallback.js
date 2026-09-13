// Fallback: if React fails to mount and dismiss the splash,
// this vanilla script will close it after 5 seconds.
// Runs independently of the React bundle.
(function () {
  var dismissed = false;
  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    try {
      var w = window.__TAURI__;
      if (w && w.invoke) {
        w.invoke('show_main_window').catch(function () {});
      }
    } catch (e) {
      console.error('[splash-fallback]', e);
    }
  }
  setTimeout(dismissSplash, 5000);
  window.__dismissSplash = dismissSplash;
})();
