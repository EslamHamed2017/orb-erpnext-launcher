"""Display-only rebrand of ERPNext as "Basetaa ERP".

Only labels and logos the user sees change. The `erpnext` app name, its routes and its
data are untouched, so updates and links keep working.
"""

import frappe

BRAND_NAME = "Basetaa ERP"
BRAND_LOGO = "/assets/orb_launcher/images/basetaa-logo.svg"
REBRANDED_APP = "erpnext"
OLD_NAMES = {"ERPNext", "ERPNext ", ""}


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

		bootinfo["orb_brand"] = {"name": BRAND_NAME, "logo": BRAND_LOGO, "replaces": "ERPNext"}
	except Exception:
		frappe.log_error(title="ORB Launcher: branding boot failed")


def apply_site_branding():
	"""Name used on the login page, emails and page titles (System Settings → App Name).

	Only set when it is still a default value, so a name an admin chose is kept.
	"""
	current = frappe.db.get_single_value("System Settings", "app_name") or ""
	if current.strip() in OLD_NAMES or current.strip() == "Frappe":
		frappe.db.set_single_value("System Settings", "app_name", BRAND_NAME)
		frappe.clear_cache()
