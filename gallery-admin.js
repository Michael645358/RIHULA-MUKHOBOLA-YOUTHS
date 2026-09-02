/* RIHULA Gallery Admin - upload, replace and delete gallery photos */
(function () {
  "use strict";

  const BUCKET = "gallery";
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const list = document.getElementById("adminGalleryList");
  const input = document.getElementById("galleryUploadInput");
  const uploadButton = document.getElementById("galleryUploadButton");
  const status = document.getElementById("galleryAdminStatus");

  function notify(message, type) {
    if (typeof showPopup === "function") showPopup(message, type || "info");
    else if (status) status.textContent = message;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slug(value) {
    return String(value || "photo")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "photo";
  }

  async function ensureAdmin() {
    if (!window.RihulaAdmin) throw new Error("Admin security module is unavailable.");
    const admin = await window.RihulaAdmin.getAdminUser();
    if (!admin) throw new Error("Administrator access is required.");
    return admin;
  }

  async function loadList() {
    if (!list) return;
    list.innerHTML = '<div class="gallery-admin-empty">Loading gallery…</div>';
    try {
      await ensureAdmin();
      const { data, error } = await db
        .from("gallery_images")
        .select("id,title,image_url,storage_path,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data?.length) {
        list.innerHTML = '<div class="gallery-admin-empty">No uploaded gallery photos yet.</div>';
        return;
      }

      list.innerHTML = data.map(item => `
        <article class="gallery-admin-item">
          <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || "Gallery photo")}">
          <div class="gallery-admin-item-body">
            <strong>${escapeHtml(item.title || "Gallery photo")}</strong>
            <small>${new Date(item.created_at).toLocaleString()}</small>
            <div class="gallery-admin-actions">
              <button type="button" class="gallery-admin-btn" data-action="replace" data-id="${item.id}">Replace</button>
              <button type="button" class="gallery-admin-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </div>
        </article>`).join("");

      list.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
          const item = data.find(row => String(row.id) === String(button.dataset.id));
          if (!item) return;
          if (button.dataset.action === "delete") deleteImage(item);
          if (button.dataset.action === "replace") chooseReplacement(item);
        });
      });
    } catch (error) {
      console.error("Gallery admin load error:", error);
      list.innerHTML = `<div class="gallery-admin-empty error">${escapeHtml(error.message || "Could not load gallery.")}</div>`;
    }
  }

  async function uploadOne(file, title, existing) {
    await ensureAdmin();
    if (!file || !file.type.startsWith("image/")) throw new Error("Please select an image file.");
    if (file.size > MAX_FILE_SIZE) throw new Error("Image is too large. Maximum size is 8 MB.");

    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${slug(file.name)}.${extension}`;

    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(path);
    const imageUrl = publicData.publicUrl;

    if (existing) {
      const { error: updateError } = await db.from("gallery_images").update({
        title: title || existing.title || "RIHULA Gallery",
        image_url: imageUrl,
        storage_path: path
      }).eq("id", existing.id);
      if (updateError) {
        await db.storage.from(BUCKET).remove([path]);
        throw updateError;
      }
      if (existing.storage_path) await db.storage.from(BUCKET).remove([existing.storage_path]);
    } else {
      const { error: insertError } = await db.from("gallery_images").insert({
        title: title || file.name.replace(/\.[^.]+$/, "") || "RIHULA Gallery",
        image_url: imageUrl,
        storage_path: path
      });
      if (insertError) {
        await db.storage.from(BUCKET).remove([path]);
        throw insertError;
      }
    }
  }

  async function uploadFiles(files) {
    if (!files?.length) return;
    uploadButton.disabled = true;
    if (status) status.textContent = "Uploading photo…";
    try {
      for (const file of files) {
        await uploadOne(file, file.name.replace(/\.[^.]+$/, ""));
      }
      notify("Gallery photo uploaded successfully.", "success");
      await loadList();
    } catch (error) {
      console.error("Gallery upload error:", error);
      notify(error.message || "Gallery upload failed.", "error");
    } finally {
      uploadButton.disabled = false;
      if (input) input.value = "";
      if (status) status.textContent = "";
    }
  }

  function chooseReplacement(item) {
    const replacement = document.createElement("input");
    replacement.type = "file";
    replacement.accept = "image/*";
    replacement.onchange = async () => {
      const file = replacement.files?.[0];
      if (!file) return;
      uploadButton.disabled = true;
      if (status) status.textContent = "Replacing photo…";
      try {
        await uploadOne(file, item.title, item);
        notify("Gallery photo replaced successfully.", "success");
        await loadList();
      } catch (error) {
        notify(error.message || "Could not replace photo.", "error");
      } finally {
        uploadButton.disabled = false;
        if (status) status.textContent = "";
      }
    };
    replacement.click();
  }

  async function deleteImage(item) {
    const confirmed = await showConfirm("Delete this gallery photo? This cannot be undone.", { title: "Delete gallery photo", confirmText: "Delete", danger: true });
    if (!confirmed) return;

    try {
      await ensureAdmin();
      const { error } = await db.from("gallery_images").delete().eq("id", item.id);
      if (error) throw error;
      if (item.storage_path) await db.storage.from(BUCKET).remove([item.storage_path]);
      notify("Gallery photo deleted.", "success");
      await loadList();
    } catch (error) {
      notify(error.message || "Could not delete photo.", "error");
    }
  }

  uploadButton?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", () => uploadFiles(input.files));
  window.RihulaGalleryAdmin = { reload: loadList };
  document.addEventListener("DOMContentLoaded", loadList);
})();
