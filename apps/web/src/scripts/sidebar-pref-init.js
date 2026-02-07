(() => {
  try {
    const value = window.localStorage.getItem("filecase.sidebar.collapsed");
    document.documentElement.dataset.fcSidebarCollapsed =
      value === "true" ? "true" : "false";
  } catch (_error) {
    document.documentElement.dataset.fcSidebarCollapsed = "false";
  }
})();
