import frappe

from orb_launcher.branding import apply_site_branding


def execute():
	apply_site_branding()
	theme_name = frappe.db.get_single_value("Website Settings", "website_theme")
	if not theme_name:
		return
	scss = frappe.db.get_value("Website Theme", theme_name, "custom_scss") or ""
	updated = scss.replace("ORB Management System", "Basetaa ERP")
	updated = updated.replace("ORB\\A TRADE MANAGEMENT", "Basetaa\\A ERP")
	if updated != scss:
		frappe.db.set_value("Website Theme", theme_name, "custom_scss", updated)
