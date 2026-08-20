/* RIHULA MUKHOBOLA — Modern notification system
   - Replaces browser alert()/confirm()
   - No loading indicators or progress bars
   - Responsive, accessible, touch friendly
*/
(function () {
  if (window.RihulaPopups) return;

  const STYLE_ID = "rihula-popup-styles";
  const ROOT_ID = "rihula-popup-root";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{
        position:fixed; inset:0; z-index:2147483647;
        pointer-events:none; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      .rp-toast-wrap{
        position:fixed; top:18px; right:18px;
        width:min(420px,calc(100vw - 28px));
        display:flex; flex-direction:column; gap:12px;
      }
      .rp-toast{
        pointer-events:auto; position:relative;
        display:grid; grid-template-columns:46px minmax(0,1fr) 32px;
        gap:12px; align-items:start;
        padding:14px 14px 14px 12px;
        background:rgba(255,255,255,.96);
        border:1px solid rgba(15,23,42,.08);
        border-left:4px solid #16803a;
        border-radius:18px;
        box-shadow:0 18px 55px rgba(15,23,42,.18);
        backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px);
        animation:rpIn .24s cubic-bezier(.2,.8,.2,1) both;
        overflow:hidden;
      }
      .rp-toast.rp-error{border-left-color:#dc3545}
      .rp-toast.rp-warning{border-left-color:#e28a00}
      .rp-toast.rp-info{border-left-color:#1976d2}
      .rp-icon{
        width:46px;height:46px;border-radius:14px;
        display:grid;place-items:center;
        background:#eaf7ef;color:#16803a;
        font-size:21px;font-weight:800;
      }
      .rp-error .rp-icon{background:#fff0f1;color:#dc3545}
      .rp-warning .rp-icon{background:#fff6e5;color:#b66a00}
      .rp-info .rp-icon{background:#edf5ff;color:#1976d2}
      .rp-title{
        margin:1px 0 4px; color:#172018;
        font-size:14px; font-weight:800; letter-spacing:.1px;
      }
      .rp-message{
        color:#5b665e; font-size:14px; line-height:1.5;
        white-space:pre-line; word-break:break-word;
      }
      .rp-close{
        width:30px;height:30px;border:0;border-radius:10px;
        background:transparent;color:#8a948d;
        font-size:22px;line-height:1;cursor:pointer;
        display:grid;place-items:center;
      }
      .rp-close:hover{background:#f2f4f2;color:#172018}
      .rp-close:focus-visible,.rp-btn:focus-visible{
        outline:3px solid rgba(25,118,210,.25);outline-offset:2px;
      }
      .rp-modal-backdrop{
        position:fixed;inset:0;padding:18px;
        display:grid;place-items:center;
        background:rgba(8,15,11,.48);
        backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
        pointer-events:auto;animation:rpFade .18s ease both;
      }
      .rp-modal{
        width:min(440px,100%);
        background:rgba(255,255,255,.98);
        border:1px solid rgba(255,255,255,.55);
        border-radius:24px;padding:25px;
        box-shadow:0 28px 80px rgba(0,0,0,.28);
        animation:rpModal .22s cubic-bezier(.2,.8,.2,1) both;
      }
      .rp-modal-icon{
        width:54px;height:54px;border-radius:16px;
        display:grid;place-items:center;
        background:#eaf7ef;color:#16803a;
        font-size:24px;font-weight:800;margin-bottom:15px;
      }
      .rp-modal h3{margin:0 0 8px;color:#172018;font-size:20px}
      .rp-modal p{margin:0;color:#5d685f;font-size:15px;line-height:1.55;white-space:pre-line}
      .rp-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:23px}
      .rp-btn{
        border:0;border-radius:12px;padding:12px 18px;
        font-weight:750;cursor:pointer;font-size:14px;
        transition:transform .15s ease,opacity .15s ease;
      }
      .rp-btn:hover{transform:translateY(-1px)}
      .rp-btn-cancel{background:#eef2ef;color:#344039}
      .rp-btn-confirm{background:#16803a;color:#fff}
      .rp-btn-danger{background:#dc3545;color:#fff}
      @keyframes rpIn{from{opacity:0;transform:translateY(-12px) scale(.98)}to{opacity:1;transform:none}}
      @keyframes rpFade{from{opacity:0}to{opacity:1}}
      @keyframes rpModal{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
      @media(max-width:600px){
        .rp-toast-wrap{top:10px;right:10px;left:10px;width:auto}
        .rp-toast{grid-template-columns:40px minmax(0,1fr) 30px;padding:12px}
        .rp-icon{width:40px;height:40px;border-radius:12px;font-size:18px}
        .rp-modal{padding:21px;border-radius:20px}
        .rp-actions{flex-direction:column-reverse}
        .rp-btn{width:100%}
      }
      @media(prefers-reduced-motion:reduce){
        .rp-toast,.rp-modal-backdrop,.rp-modal{animation:none}
        .rp-btn{transition:none}
      }
    `;
    document.head.appendChild(style);
  }

  function root() {
    let el = document.getElementById(ROOT_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = ROOT_ID;
      document.body.appendChild(el);
    }
    return el;
  }

  const icons = {success:"✓", error:"!", warning:"!", info:"i"};
  const titles = {
    success:"Success",
    error:"Something went wrong",
    warning:"Please check",
    info:"Information"
  };

  function toast(message, type="info", title="", duration=4000) {
    injectStyles();
    const r = root();
    let wrap = r.querySelector(".rp-toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "rp-toast-wrap";
      r.appendChild(wrap);
    }

    const item = document.createElement("div");
    item.className = `rp-toast rp-${type}`;

    const icon = document.createElement("div");
    icon.className = "rp-icon";
    icon.textContent = icons[type] || icons.info;

    const body = document.createElement("div");
    const heading = document.createElement("div");
    heading.className = "rp-title";
    heading.textContent = title || titles[type] || "Notification";

    const msg = document.createElement("div");
    msg.className = "rp-message";
    msg.textContent = String(message ?? "");

    body.append(heading, msg);

    const close = document.createElement("button");
    close.className = "rp-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close notification");
    close.textContent = "×";

    item.append(icon, body, close);
    wrap.appendChild(item);

    let timer;
    const remove = () => {
      if (!item.isConnected) return;
      clearTimeout(timer);
      item.style.opacity = "0";
      item.style.transform = "translateY(-7px) scale(.98)";
      item.style.transition = ".18s ease";
      setTimeout(() => item.remove(), 180);
    };
    close.onclick = remove;
    timer = setTimeout(remove, duration);
    item.addEventListener("mouseenter", () => clearTimeout(timer));
    item.addEventListener("mouseleave", () => {
      timer = setTimeout(remove, 1800);
    });
    return item;
  }

  function confirmDialog(message, options={}) {
    injectStyles();
    return new Promise(resolve => {
      const r = root();
      const backdrop = document.createElement("div");
      backdrop.className = "rp-modal-backdrop";

      const modal = document.createElement("div");
      modal.className = "rp-modal";
      modal.setAttribute("role","dialog");
      modal.setAttribute("aria-modal","true");

      const icon = document.createElement("div");
      icon.className = "rp-modal-icon";
      icon.textContent = options.icon || "?";

      const h = document.createElement("h3");
      h.textContent = options.title || "Are you sure?";

      const p = document.createElement("p");
      p.textContent = String(message ?? "");

      const actions = document.createElement("div");
      actions.className = "rp-actions";

      const cancel = document.createElement("button");
      cancel.className = "rp-btn rp-btn-cancel";
      cancel.type = "button";
      cancel.textContent = options.cancelText || "Cancel";

      const confirm = document.createElement("button");
      confirm.className = `rp-btn ${options.danger ? "rp-btn-danger" : "rp-btn-confirm"}`;
      confirm.type = "button";
      confirm.textContent = options.confirmText || "Continue";

      actions.append(cancel, confirm);
      modal.append(icon,h,p,actions);
      backdrop.appendChild(modal);
      r.appendChild(backdrop);

      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey);
        backdrop.remove();
        resolve(value);
      };
      const onKey = e => {
        if (e.key === "Escape") finish(false);
        if (e.key === "Enter") finish(true);
      };

      cancel.onclick = () => finish(false);
      confirm.onclick = () => finish(true);
      backdrop.addEventListener("click", e => {
        if (e.target === backdrop) finish(false);
      });
      document.addEventListener("keydown", onKey);
      setTimeout(() => confirm.focus(), 0);
    });
  }

  window.RihulaPopups = {
    toast,
    confirm: confirmDialog,
    success: m => toast(m,"success"),
    error: m => toast(m,"error"),
    warning: m => toast(m,"warning"),
    info: m => toast(m,"info")
  };
  window.showPopup = (message,type="info",title="",duration=4000) =>
    toast(message,type,title,duration);
  window.showConfirm = (message,options={}) => confirmDialog(message,options);
})();
