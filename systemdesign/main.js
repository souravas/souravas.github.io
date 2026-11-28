import "../shared/document-reader.js";

const diagramObserver = new ResizeObserver((entries) => {
  for (const { target: view } of entries) {
    const hint = view.previousElementSibling;
    hint.hidden = view.scrollWidth <= view.clientWidth;
  }
});

for (const view of document.querySelectorAll(".diagram-view")) {
  diagramObserver.observe(view);
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/systemdesign" }).catch(() => {});
}
