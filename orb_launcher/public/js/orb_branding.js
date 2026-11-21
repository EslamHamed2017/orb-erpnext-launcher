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

  const run = () => { fixTitle(); fixFavicon(); fixNodes(document.body); };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(run, 40); };

  const boot = () => {
    run();
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true, characterData: true});
    const title = document.querySelector("title");
    if (title) new MutationObserver(fixTitle).observe(title, {childList: true, characterData: true, subtree: true});
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once: true});
  else boot();
})();
