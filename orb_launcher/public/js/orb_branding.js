// Display-only rebrand: "ERPNext" -> "Basetaa ERP" in the tab title, favicon, app tiles and
// sidebar. Only text that is exactly "ERPNext" is touched, so user data is never rewritten.
(() => {
  "use strict";
  const OLD = "ERPNext";
  const brand = () => (window.frappe && frappe.boot && frappe.boot.orb_brand) || {
    name: "Basetaa ERP", logo: "/assets/orb_launcher/images/basetaa-logo.svg"
  };
  const isErpnextLogo = (src) => /\/assets\/erpnext\/.*(logo|erpnext)[^/]*\.(svg|png)/i.test(src || "");
  let timer = null;

  const fixTitle = () => {
    if (document.title.includes(OLD)) document.title = document.title.split(OLD).join(brand().name);
  };

  const fixFavicon = () => {
    document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (link.dataset.orbBrand) return;
      if (isErpnextLogo(href) || /\/assets\/frappe\/images\/frappe-favicon/i.test(href)) {
        link.setAttribute("href", brand().logo);
        link.setAttribute("type", "image/svg+xml");
        link.dataset.orbBrand = "1";
      }
    });
  };

  const fixNodes = (root) => {
    if (!root || !root.querySelectorAll) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.nodeValue.trim() === OLD && !node.parentElement?.closest("input,textarea,[contenteditable],.ql-editor,.CodeMirror,.ace_editor,.frappe-control")
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    hits.forEach((node) => { node.nodeValue = node.nodeValue.replace(OLD, brand().name); });

    root.querySelectorAll("img").forEach((img) => {
      if (isErpnextLogo(img.getAttribute("src"))) img.setAttribute("src", brand().logo);
      if (img.getAttribute("alt") === OLD) img.setAttribute("alt", brand().name);
    });
    root.querySelectorAll(`[title="${OLD}"],[data-original-title="${OLD}"],[aria-label="${OLD}"]`).forEach((el) => {
      ["title", "data-original-title", "aria-label"].forEach((attr) => {
        if (el.getAttribute(attr) === OLD) el.setAttribute(attr, brand().name);
      });
    });
  };

  // Odoo-style module names on a module's own page: the big heading and the tab title use the
  // workspace's internal name, which is not renamed. Only exact matches inside the page header
  // and the tab title change.
  const workspaceNames = () => (window.frappe && frappe.boot && frappe.boot.orb_workspace_names) || {};

  const fixModuleHeading = () => {
    const names = workspaceNames();
    if (!Object.keys(names).length) return;
    document.querySelectorAll(".page-head .title-text, .page-head .page-title h3, .page-head .page-title .title-area span, .workspace-title").forEach((el) => {
      el.childNodes.forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const text = node.nodeValue.trim();
        if (names[text]) node.nodeValue = node.nodeValue.replace(text, __(names[text]));
      });
      const title = el.getAttribute("title");
      if (title && names[title]) el.setAttribute("title", __(names[title]));
    });
    const [head, ...rest] = document.title.split(" | ");
    if (names[head]) document.title = [__(names[head]), ...rest].join(" | ");
  };

  const fixDockLabels = () => {
    const names = (window.frappe && frappe.boot && frappe.boot.orb_module_names) || {};
    document.querySelectorAll("#desk-dock .dock-items .dock-item").forEach((item) => {
      const current = item.dataset.orbModule || item.getAttribute("aria-label") || item.querySelector(".dock-item-label")?.textContent?.trim();
      if (!current || !names[current]) return;
      item.dataset.orbModule = current;
      const label = __(names[current]);
      item.setAttribute("aria-label", label);
      if (item.hasAttribute("title")) item.setAttribute("title", label);
      const text = item.querySelector(".dock-item-label");
      if (text) text.textContent = label;
    });
  };

  const fixWorkspaceSearchLabels = () => {
    const names = (window.frappe && frappe.boot && frappe.boot.orb_module_names) || {};
    document.querySelectorAll('[role="dialog"] a[href*="/desk/Workspaces/"]').forEach((link) => {
      const strong = link.querySelector("b");
      const internal = strong?.textContent?.trim();
      if (internal && names[internal]) strong.textContent = __(names[internal]);
    });
  };

  const fixDockManagerLabels = () => {
    const names = (window.frappe && frappe.boot && frappe.boot.orb_module_names) || {};
    document.querySelectorAll(".modal.show .ws-arrangement").forEach((arrangement) => {
      const rows = Array.from(arrangement.querySelectorAll(".ws-item[data-key]"));
      const preview = arrangement.closest(".modal")?.querySelectorAll(".ws-preview .ws-preview-item") || [];
      rows.forEach((row, index) => {
        const parts = (row.dataset.key || "").split("|");
        const internal = parts[0] === "Sidebar" ? parts[1] : null;
        if (!internal || !names[internal]) return;
        const label = __(names[internal]);
        const rowLabel = row.querySelector(".ws-item-label");
        if (rowLabel) rowLabel.textContent = label;
        const previewLabel = preview[index]?.querySelector(".ws-item-label");
        if (previewLabel) previewLabel.textContent = label;
      });
    });
  };

  const run = () => {
    fixTitle();
    fixFavicon();
    fixNodes(document.body);
    fixModuleHeading();
    fixDockLabels();
    fixWorkspaceSearchLabels();
    fixDockManagerLabels();
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(run, 40); };

  const boot = () => {
    run();
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true, characterData: true});
    const title = document.querySelector("title");
    if (title) new MutationObserver(() => { fixTitle(); fixModuleHeading(); }).observe(title, {childList: true, characterData: true, subtree: true});
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once: true});
  else boot();
})();
