import frappe

from orb_launcher.branding import apply_site_branding


def execute():
	apply_site_branding()

	theme_name = frappe.db.get_single_value("Website Settings", "website_theme")
	if not theme_name or not frappe.db.exists("Website Theme", theme_name):
		return

	scss = frappe.db.get_value("Website Theme", theme_name, "custom_scss") or ""
	restored = (
		scss.replace("/* Basetaa ERP — login-only presentation theme */", "/* ORB Management System — login-only presentation theme */")
		.replace('content: "Basetaa\\A ERP";', 'content: "ORB\\A TRADE MANAGEMENT";')
	)
	if restored != scss:
		frappe.db.set_value("Website Theme", theme_name, "custom_scss", restored, update_modified=False)

	frappe.clear_cache()
	from frappe.website.utils import clear_website_cache
	clear_website_cache()
