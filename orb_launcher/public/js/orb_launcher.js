(() => {
  "use strict";
  const MOUNT_ID = "orb-module-launcher";
  // Each module keeps its colour wherever it is moved (these match the original default order).
  const MODULE_COLORS = {
    Projects: "#6D5BD0", Setup: "#2563EB", Accounts: "#059669", Selling: "#EA580C", Buying: "#0891B2",
    Stock: "#D97706", Manufacturing: "#C026D3", Assets: "#4F46E5", Quality: "#6D5BD0", CRM: "#2563EB", Support: "#059669"
  };
  const PALETTE = ["#6D5BD0", "#2563EB", "#059669", "#EA580C", "#0891B2", "#D97706", "#C026D3", "#4F46E5"];
  const APPS_HEADING_ID = "orb-apps-heading";
  // Cards and the sidebar rail share one order: the user's own layer of the ERPNext dock, the
  // same one Frappe's "Arrange dock" writes. Reordering cards saves that layer; reordering the
  // dock updates `frappe.boot.dock`, which the cards are read from. Only order changes.
  const DOCK_APP = "erpnext";
  const SAVE_USER_DOCK = "frappe.desk.doctype.dock.dock.save_user_dock";
  const HOLD_MS = 350;
  let timer = null;
  let dragging = false;

  const isModuleRow = (row) => row && row.hidden !== 1 && row.link_type === "Sidebar" && row.link_to;

  const refreshSidebar = () => {
    try {
      const sidebar = frappe.app?.sidebar;
      sidebar?.refresh_dock?.();
      sidebar?.refresh_header?.();
    } catch (error) { /* the cards are already right; the rail redraws on next load */ }
  };

  const setRail = (rail) => {
    frappe.boot.dock = {...(frappe.boot.dock || {}), [DOCK_APP]: rail};
    refreshSidebar();
  };

  // Put the module rows in `order` into the slots module rows already hold, so hidden rows and
  // rows of other kinds (workspaces, URLs) keep their places.
  const saveOrder = (order) => {
    const rows = ((frappe.boot.dock || {})[DOCK_APP] || []).slice();
    const slots = [];
    rows.forEach((row, index) => { if (isModuleRow(row)) slots.push(index); });
    const moved = order.map((key) => rows.find((row) => isModuleRow(row) && row.link_to === key)).filter(Boolean);
    if (moved.length !== slots.length) return;

    const previous = rows.slice();
    slots.forEach((slot, i) => { rows[slot] = moved[i]; });
    setRail(rows);

    const items = rows.filter(Boolean).map((row) => ({
      link_type: row.link_type,
      link_to: row.link_to || null,
      url: row.url || null,
      icon: row.icon || null,
      title: row.title || null,
      hidden: row.hidden ? 1 : 0,
    }));
    try {
      frappe.xcall(SAVE_USER_DOCK, {app: DOCK_APP, items: JSON.stringify(items)})
        .then((rail) => { if (Array.isArray(rail)) setRail(rail); })
        .catch(() => {
          setRail(previous);
          const mount = document.getElementById(MOUNT_ID);
          if (mount) mount.dataset.signature = "";
          schedule();
          frappe.show_alert?.({message: __("Could not save the new order"), indicator: "red"});
        });
    } catch (error) { /* xcall unavailable: order stays for this page only */ }
  };

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  const visibleModules = () => {
    const raw = ((frappe.boot.dock || {})[DOCK_APP] || []).filter(isModuleRow);
    const sidebar = frappe.app?.sidebar;
    const colorOf = (key) => {
      if (MODULE_COLORS[key]) return MODULE_COLORS[key];
      let hash = 0;
      for (const char of String(key)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
      return PALETTE[hash % PALETTE.length];
    };
    return raw.map((item) => {
      const entry = sidebar?.dock_entry ? sidebar.dock_entry(item) : item;
      if (entry) entry.__orb_color = colorOf(item.link_to);
      return entry;
    }).filter(Boolean);
  };

  const slug = (value) => {
    try { if (frappe.router?.slug) return frappe.router.slug(value); } catch (error) { /* fallback */ }
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const workspacePages = () => frappe.boot?.workspaces?.pages || [];

  const workspaceRoute = (name) => {
    const page = workspacePages().find((p) => p.name === name);
    if (!page) return null;
    return page.public ? `/desk/${slug(page.name)}` : `/desk/private/${slug(page.title || page.name)}`;
  };

  // The module's own workspace page (e.g. Projects -> /desk/projects), resolved from the boot
  // payload so it works on the Apps page too, where the desk sidebar is not built yet.
  const moduleRoute = (item) => {
    const module = item.module || item.link_to;
    const direct = workspacePages().find((p) => p.public && (p.name === module || p.name === item.label));
    if (direct) return workspaceRoute(direct.name);

    const moduleSidebar = frappe.boot?.module_sidebars?.[module];
    for (const entry of moduleSidebar?.items || []) {
      if (entry.type !== "Link") continue;
      if (entry.link_type === "Workspace") {
        const route = workspaceRoute(entry.link_to);
        if (route) return route;
        continue;
      }
      try {
        const route = frappe.ui?.sidebar_item?.get_route?.(entry, false, module);
        if (route) return route;
      } catch (error) { /* try next item */ }
    }

    const owned = workspacePages().find((p) => p.public && p.module === module);
    if (owned) return workspaceRoute(owned.name);

    try {
      const route = frappe.app?.sidebar?.dock_entry_route?.(item);
      if (route) return route;
    } catch (error) { /* fallback below */ }
    return item.url || `/desk/${slug(module)}`;
  };

  const iconMarkup = (name) => {
    try { return frappe.utils.icon(name || "grid", "xl"); }
    catch (error) { return `<span class="orb-module-fallback">${escapeHTML((name || "M").slice(0, 1).toUpperCase())}</span>`; }
  };

  const openModule = (event, item, route) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return; // new tab
    event.preventDefault();
    try {
      // Select the module's sidebar first so it is right when the page lands.
      if (item.module && frappe.app?.sidebar?.select_shell) frappe.app.sidebar.select_shell(item.module);
    } catch (error) { /* navigation still works */ }
    if (/^\/(desk|app)\//.test(route) && frappe.set_route) frappe.set_route(route);
    else window.location.assign(route);
  };

  const enableReorder = (moduleGrid) => {
    let pending = null;

    const cards = () => Array.from(moduleGrid.querySelectorAll(".orb-module-card:not(.orb-is-ghost)"));

    const cancelPending = () => {
      if (!pending) return;
      clearTimeout(pending.holdTimer);
      pending = null;
    };

    const startDrag = (state) => {
      const card = state.card;
      const rect = card.getBoundingClientRect();
      dragging = true;
      state.active = true;
      state.offsetX = state.x - rect.left;
      state.offsetY = state.y - rect.top;

      const ghost = card.cloneNode(true);
      ghost.classList.add("orb-is-ghost");
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      document.body.appendChild(ghost);
      state.ghost = ghost;

      card.classList.add("orb-is-placeholder");
      moduleGrid.classList.add("orb-is-sorting");
      document.body.classList.add("orb-launcher-dragging");
      try { card.setPointerCapture(state.pointerId); } catch (error) { /* ignore */ }
    };

    const moveDrag = (state, x, y) => {
      state.ghost.style.left = `${x - state.offsetX}px`;
      state.ghost.style.top = `${y - state.offsetY}px`;
      const target = cards().find((card) => {
        if (card === state.card) return false;
        const r = card.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      if (!target) return;
      const list = cards();
      const from = list.indexOf(state.card);
      const to = list.indexOf(target);
      const before = list.map((card) => [card, card.getBoundingClientRect()]);
      moduleGrid.insertBefore(state.card, from < to ? target.nextSibling : target);
      before.forEach(([card, r]) => {
        if (card === state.card) return;
        const n = card.getBoundingClientRect();
        const dx = r.left - n.left;
        const dy = r.top - n.top;
        if (!dx && !dy) return;
        card.animate([{transform: `translate(${dx}px, ${dy}px)`}, {transform: "none"}], {duration: 180, easing: "ease-out"});
      });
    };

    const endDrag = (state) => {
      const rect = state.card.getBoundingClientRect();
      const ghost = state.ghost;
      ghost.style.transition = "left .16s ease, top .16s ease, transform .16s ease, box-shadow .16s ease";
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.classList.add("orb-is-dropping");
      setTimeout(() => {
        ghost.remove();
        state.card.classList.remove("orb-is-placeholder");
        moduleGrid.classList.remove("orb-is-sorting");
        document.body.classList.remove("orb-launcher-dragging");
        dragging = false;
      }, 170);
      saveOrder(cards().map((card) => card.dataset.module));
      const mount = document.getElementById(MOUNT_ID);
      if (mount) mount.dataset.signature = signatureOf(visibleModules());
    };

    moduleGrid.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || dragging) return;
      const card = event.target.closest(".orb-module-card");
      if (!card) return;
      const state = {card, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false};
      state.holdTimer = setTimeout(() => startDrag(state), HOLD_MS);
      pending = state;
    });

    window.addEventListener("pointermove", (event) => {
      if (!pending || event.pointerId !== pending.pointerId) return;
      if (!pending.active) {
        if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 6) cancelPending();
        return;
      }
      event.preventDefault();
      moveDrag(pending, event.clientX, event.clientY);
    }, {passive: false});

    const finish = (event) => {
      if (!pending || event.pointerId !== pending.pointerId) return;
      const state = pending;
      cancelPending();
      if (!state.active) return;
      state.card.dataset.suppressClick = "1";
      setTimeout(() => { delete state.card.dataset.suppressClick; }, 0);
      endDrag(state);
    };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);

    moduleGrid.addEventListener("dragstart", (event) => event.preventDefault());
    moduleGrid.addEventListener("contextmenu", (event) => { if (dragging || pending?.active) event.preventDefault(); });
    moduleGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".orb-module-card");
      if (card && card.dataset.suppressClick) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  };

  const signatureOf = (modules) => modules.map((item) => `${item.link_to}:${item.hidden || 0}:${item.icon || ""}`).join("|");

  const render = () => {
    if (dragging) return;
    if (!window.frappe || !frappe.boot || !frappe.boot.dock) return;
    const appTiles = Array.from(document.querySelectorAll(".desktop-icon"));
    if (!appTiles.length) return;
    const grid = appTiles[0].parentElement;
    if (!grid || !grid.parentElement) return;
    const modules = visibleModules();
    if (!modules.length) return;
    if (!document.getElementById(APPS_HEADING_ID)) {
      const heading = document.createElement("div");
      heading.id = APPS_HEADING_ID;
      heading.className = "orb-launcher-heading";
      heading.innerHTML = `
        <div>
          <h2>${escapeHTML(__("Applications"))}</h2>
        </div>`;
      grid.insertAdjacentElement("beforebegin", heading);
    }
    appTiles.forEach((tile) => {
      const caption = tile.querySelector(".icon-caption");
      if (caption && !caption.querySelector(".icon-subtitle, .orb-app-subtitle")) {
        const sub = document.createElement("span");
        sub.className = "orb-app-subtitle";
        sub.textContent = __("Open app");
        caption.appendChild(sub);
      }
    });
    const signature = signatureOf(modules);
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
          <p class="orb-launcher-hint">${escapeHTML(__("Press and hold a module to rearrange"))}</p>
        </div>
        <span class="orb-launcher-count">${modules.length} ${escapeHTML(__("Modules"))}</span>
      </div>
      <div class="orb-module-grid" role="navigation" aria-label="${escapeHTML(__("Business Modules"))}"></div>`;
    const moduleGrid = mount.querySelector(".orb-module-grid");
    enableReorder(moduleGrid);
    modules.forEach((item, index) => {
      const route = moduleRoute(item);
      const card = document.createElement("a");
      card.className = "orb-module-card";
      card.href = route;
      card.draggable = false;
      card.dataset.module = item.link_to;
      card.style.setProperty("--orb-module-color", item.__orb_color || PALETTE[index % PALETTE.length]);
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

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 60);
  }

  const boot = () => {
    schedule();
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    window.addEventListener("popstate", schedule);
    window.addEventListener("hashchange", schedule);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once: true});
  else boot();
})();
