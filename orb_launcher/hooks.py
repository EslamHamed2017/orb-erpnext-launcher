app_name = "orb_launcher"
app_title = "ORB Launcher"
app_publisher = "Basetaa"
app_description = "Odoo-style module launcher for ERPNext"
app_email = "support@basetaa.com"
app_license = "MIT"

# Add the launcher to every authenticated Desk session.
app_include_js = ["/assets/orb_launcher/js/orb_branding.js?v=0.6.6", "/assets/orb_launcher/js/orb_launcher.js?v=0.6.6"]
app_include_css = ["/assets/orb_launcher/css/orb_launcher.css?v=0.6.6"]
web_include_js = ["/assets/orb_launcher/js/orb_branding.js?v=0.6.6", "/assets/orb_launcher/js/orb_login.js?v=0.6.6"]
web_include_css = ["/assets/orb_launcher/css/orb_login.css?v=0.6.6"]

# Display-only rebrand of ERPNext as "Basetaa ERP" (see orb_launcher/branding.py)
boot_session = "orb_launcher.branding.boot_session"
after_install = "orb_launcher.branding.apply_site_branding"
