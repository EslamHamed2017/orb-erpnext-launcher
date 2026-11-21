"""Display-only rebrand of ERPNext as "Basetaa ERP".

Only labels and logos the user sees change. The `erpnext` app name, its routes and its
data are untouched, so updates and links keep working.
"""

import frappe

BRAND_NAME = "Basetaa ERP"
BRAND_LOGO = "/assets/orb_launcher/images/basetaa-logo.svg"
REBRANDED_APP = "erpnext"
OLD_NAMES = {"ERPNext", "ERPNext ", ""}

# Odoo-style display names. Keys are ERPNext's module (sidebar) names; only the label changes,
# never the module, its routes or its data.
MODULE_NAMES = {
	"Projects": "Project",
	"Accounts": "Accounting",
	"Selling": "Sales",
	"Buying": "Purchase",
	"Stock": "Inventory",
	"Support": "Helpdesk",
	"Setup": "Settings",
}

# The module workspaces whose page title changes with them (Accounts' is already "Accounting",
# and Setup lands on the shared Home workspace, which keeps its name).
WORKSPACE_NAMES = {
	"Projects": "Project",
	"Selling": "Sales",
	"Buying": "Purchase",
	"Stock": "Inventory",
	"Support": "Helpdesk",
}


def boot_session(bootinfo):
	"""Swap ERPNext's title and logo in the desk boot payload."""
	try:
		for app in bootinfo.get("app_data") or []:
			if app.get("app_name") == REBRANDED_APP:
				app["app_title"] = BRAND_NAME
				app["app_logo_url"] = BRAND_LOGO

		logo = bootinfo.get("app_logo_url")
		if not logo or "erpnext" in str(logo).lower():
			bootinfo["app_logo_url"] = BRAND_LOGO

		for icon in bootinfo.get("desktop_icons") or []:
			if isinstance(icon, dict) and icon.get("app") == REBRANDED_APP and icon.get("label") == "ERPNext":
				icon["logo_url"] = BRAND_LOGO

		rename_modules(bootinfo)

		bootinfo["orb_brand"] = {"name": BRAND_NAME, "logo": BRAND_LOGO, "replaces": "ERPNext"}
		bootinfo["orb_module_names"] = MODULE_NAMES
		bootinfo["orb_workspace_names"] = WORKSPACE_NAMES
	except Exception:
		frappe.log_error(title="ORB Launcher: branding boot failed")


def apply_site_branding():
	"""Set the display name used on the login page, emails and page titles.

	This changes only System Settings → App Name. The internal ``erpnext`` app name,
	routes and data remain untouched.
	"""
	changed = False
	for doctype in ("System Settings", "Website Settings"):
		current = frappe.db.get_single_value(doctype, "app_name") or ""
		if current.strip() != BRAND_NAME:
			frappe.db.set_single_value(doctype, "app_name", BRAND_NAME)
			changed = True
	if changed:
		frappe.clear_cache()
		frappe.clear_website_cache()


def rename_modules(bootinfo):
	"""Give modules their Odoo-style labels in the sidebar header, the rail and the cards.

	A title a user or the site set on a dock row is kept. A row whose title is just the old name
	gets the new one, and remembers the old one so saving the order does not store the new label
	as an override.
	"""
	sidebars = bootinfo.get("module_sidebars") or {}
	for module, label in MODULE_NAMES.items():
		sidebar = sidebars.get(module)
		if isinstance(sidebar, dict):
			sidebar["label"] = label

	for row in (bootinfo.get("dock") or {}).get(REBRANDED_APP) or []:
		if not isinstance(row, dict) or row.get("link_type") != "Sidebar":
			continue
		new = MODULE_NAMES.get(row.get("link_to"))
		if new and row.get("title") in (None, "", row.get("link_to")):
			row["orb_original_title"] = row.get("title") or None
			row["title"] = new

	for page in (bootinfo.get("workspaces") or {}).get("pages") or []:
		if isinstance(page, dict) and page.get("public") and page.get("name") in WORKSPACE_NAMES:
			if page.get("title") in (None, "", page.get("name")):
				page["title"] = WORKSPACE_NAMES[page["name"]]
