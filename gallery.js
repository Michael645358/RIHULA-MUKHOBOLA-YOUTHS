/* RIHULA Gallery - public gallery loader + zoom/download viewer */
(function () {
  "use strict";

  const FALLBACK_IMAGES = [
    "images/gallery1.jpg",
    "images/gallery2.jpg",
    "images/gallery3.jpg",
    "images/gallery4.jpg",
    "images/gallery5.jpg",
    "images/gallery6.jpg"
  ];

  const grid = document.getElementById("galleryGrid");
  const status = document.getElementById("galleryStatus");
  const modal = document.getElementById("galleryViewer");
  const viewerImage = document.getElementById("galleryViewerImage");
  const viewerTitle = document.getElementById("galleryViewerTitle");
  const downloadButton = document.getElementById("galleryDownload");
  const closeButton = document.getElementById("galleryClose");
  const zoomInButton = document.getElementById("galleryZoomIn");
  const zoomOutButton = document.getElementById("galleryZoomOut");
  const zoomResetButton = document.getElementById("galleryZoomReset");

  let zoom = 1;
  let currentUrl = "";
  let currentTitle = "RIHULA Gallery";

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setStatus(message) {
    if (status) status.textContent = message || "";
  }

  function render(images) {
    if (!grid) return;
    grid.innerHTML = images.map((item, index) => {
      const url = item.image_url || item.url;
      const title = item.title || `RIHULA Gallery ${index + 1}`;
      return `
        <button class="gallery-card" type="button"
          data-gallery-url="${escapeHtml(url)}"
          data-gallery-title="${escapeHtml(title)}"
          aria-label="Open ${escapeHtml(title)}">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
          <span class="gallery-card-overlay">🔍 View photo</span>
        </button>`;
    }).join("");

    grid.querySelectorAll(".gallery-card").forEach(card => {
      card.addEventListener("click", () => openViewer(card.dataset.galleryUrl, card.dataset.galleryTitle));
    });
  }

  async function loadGallery() {
    setStatus("Loading photos…");

    try {
      if (!window.db) throw new Error("Supabase is not ready");
      const { data, error } = await window.db
        .from("gallery_images")
        .select("id,title,image_url,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (Array.isArray(data) && data.length) {
        render(data);
        setStatus(`${data.length} photo${data.length === 1 ? "" : "s"}`);
        return;
      }
    } catch (error) {
      console.warn("RIHULA gallery database unavailable; using local gallery.", error);
    }

    render(FALLBACK_IMAGES.map((url, i) => ({ url, title: `RIHULA Gallery ${i + 1}` })));
    setStatus("Community gallery");
  }

  function applyZoom() {
    if (!viewerImage) return;
    viewerImage.style.transform = `scale(${zoom})`;
    viewerImage.style.cursor = zoom > 1 ? "zoom-out" : "zoom-in";
  }

  function openViewer(url, title) {
    if (!modal || !viewerImage) return;
    currentUrl = url;
    currentTitle = title || "RIHULA Gallery";
    zoom = 1;
    viewerImage.src = url;
    viewerImage.alt = currentTitle;
    if (viewerTitle) viewerTitle.textContent = currentTitle;
    applyZoom();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-viewer-open");
  }

  function closeViewer() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-viewer-open");
    if (viewerImage) viewerImage.src = "";
  }

  async function downloadCurrentImage() {
    if (!currentUrl) return;
    try {
      const response = await fetch(currentUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Image download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = (currentTitle || "rihula-gallery")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "") + ".jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (error) {
      // Cross-origin fall back: opening the public image still lets the browser save it.
      window.open(currentUrl, "_blank", "noopener,noreferrer");
    }
  }

  closeButton?.addEventListener("click", closeViewer);
  zoomInButton?.addEventListener("click", () => { zoom = Math.min(4, +(zoom + 0.25).toFixed(2)); applyZoom(); });
  zoomOutButton?.addEventListener("click", () => { zoom = Math.max(1, +(zoom - 0.25).toFixed(2)); applyZoom(); });
  zoomResetButton?.addEventListener("click", () => { zoom = 1; applyZoom(); });
  downloadButton?.addEventListener("click", downloadCurrentImage);

  viewerImage?.addEventListener("click", () => {
    zoom = zoom > 1 ? 1 : 2;
    applyZoom();
  });

  modal?.addEventListener("click", event => {
    if (event.target === modal) closeViewer();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeViewer();
  });

  window.addEventListener("load", loadGallery);
  window.RihulaGallery = { reload: loadGallery, open: openViewer, close: closeViewer };
})();
