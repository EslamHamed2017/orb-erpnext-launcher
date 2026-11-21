(() => {
  "use strict";
  const MOUNT_ID = "orb-module-launcher";
  const PALETTE = ["#6D5BD0", "#2563EB", "#059669", "#EA580C", "#0891B2", "#D97706", "#C026D3", "#4F46E5"];
  let timer = null;

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  const visibleModules = () => {
    const raw = ((frappe.boot.dock || {}).erpnext || [])
      .filter((item) => item && item.hidden !== 1 && item.link_type === "Sidebar" && item.link_to);
    const sidebar = frappe.app?.sidebar;
    return raw.map((item) => sidebar?.dock_entry ? sidebar.dock_entry(item) : item).filter(Boolean);
  };

  const moduleRoute = (item) => {
    try {
      return frappe.app?.sidebar?.dock_entry_route?.(item) || item.url || "/desk/home";
    } catch (error) {
      return item.url || "/desk/home";
    }
  };

  const iconMarkup = (name) => {
    try { return frappe.utils.icon(name || "grid", "xl"); }
    catch (error) { return `<span class="orb-module-fallback">${escapeHTML((name || "M").slice(0, 1).toUpperCase())}</span>`; }
  };

  const openModule = (event, item, route) => {
    event.preventDefault();
    try {
      if (frappe.app && frappe.app.sidebar && frappe.app.sidebar.open_dock_entry) {
        frappe.app.sidebar.open_dock_entry(item);
        return;
      }
    } catch (error) { /* use safe fallback */ }
    window.location.assign(route);
  };

  const render = () => {
    if (!window.frappe || !frappe.boot || !frappe.boot.dock) return;
    const appTiles = Array.from(document.querySelectorAll(".desktop-icon"));
    if (!appTiles.length) return;
    const grid = appTiles[0].parentElement;
    if (!grid || !grid.parentElement) return;
    const modules = visibleModules();
    if (!modules.length) return;
    const signature = modules.map((item) => `${item.link_to}:${item.hidden || 0}:${item.icon || ""}`).join("|");
    let mount = document.getElementById(MOUNT_ID);
    if (mount && mount.dataset.signature === signature && mount.parentElement === grid.parentElement) return;
    if (!mount) {
      mount = document.createElement("section");
      mount.id = MOUNT_ID;
      grid.insertAdjacentElement("afterend", mount);
    }
    mount.dataset.signature = signature;
    mount.innerHTML = `
      <div class="orb-launcher-heading">
        <div>
          <span class="orb-launcher-kicker">ORB MANAGEMENT SYSTEM</span>
          <h2>${escapeHTML(__("Business Modules"))}</h2>
          <p>${escapeHTML(__("Quick access to the modules enabled in your sidebar"))}</p>
        </div>
        <span class="orb-launcher-count">${modules.length} ${escapeHTML(__("Modules"))}</span>
      </div>
      <div class="orb-module-grid" role="navigation" aria-label="${escapeHTML(__("Business Modules"))}"></div>`;
    const moduleGrid = mount.querySelector(".orb-module-grid");
    modules.forEach((item, index) => {
      const route = moduleRoute(item);
      const card = document.createElement("a");
      card.className = "orb-module-card";
      card.href = route;
      card.style.setProperty("--orb-module-color", PALETTE[index % PALETTE.length]);
      card.style.setProperty("--orb-module-delay", `${index * 45}ms`);
      card.innerHTML = `
        <span class="orb-module-icon" aria-hidden="true">${iconMarkup(item.icon)}</span>
        <span class="orb-module-copy">
          <strong>${escapeHTML(__(item.title || item.link_to))}</strong>
          <small>${escapeHTML(__("Open workspace"))}</small>
        </span>
        <span class="orb-module-arrow" aria-hidden="true">${iconMarkup("arrow-up-right")}</span>`;
      card.addEventListener("click", (event) => openModule(event, item, route));
      moduleGrid.appendChild(card);
    });
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(render, 60);
  };

  const boot = () => {
    schedule();
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    window.addEventListener("popstate", schedule);
    window.addEventListener("hashchange", schedule);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once: true});
  else boot();
})();
