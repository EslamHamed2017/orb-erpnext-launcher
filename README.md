# ORB ERPNext Launcher

A lightweight, Odoo-style module launcher for **ERPNext / Frappe Desk**. It keeps the original ERPNext and Framework app icons untouched and adds a responsive **Business Modules** section for the modules currently enabled in the ERPNext sidebar.

## Features

- Reads the live module arrangement from `frappe.boot.dock.erpnext`.
- Shows only non-hidden sidebar entries, in the same order as the native dock.
- Uses Frappe's native `dock_entry_route` and `open_dock_entry` navigation.
- Preserves the original ERPNext, Framework, sidebar, roles, and permissions.
- Responsive card layout; the native ERPNext and Framework tiles are restyled as matching cards.
- Press and hold a module card, then drag it to rearrange. The order is saved per user (browser + user defaults).
- Rebrands ERPNext as **Basetaa ERP** (display only): app tile, sidebar logo, tab title, favicon and
  System Settings → App Name (login page / emails). The `erpnext` app itself is not renamed.
- Each card opens the module's own workspace (e.g. Projects → `/desk/projects`), not the generic Home page.
- No changes to Frappe or ERPNext core files.

## Compatibility

- Tested with Frappe **16.60.2**
- Tested with ERPNext **16.60.0**

The launcher uses Frappe v16 dock APIs. Earlier Frappe versions may require adaptation.

## Installation

From your Frappe Bench directory:

```bash
bench get-app https://github.com/EslamHamed2017/orb-erpnext-launcher.git
bench --site your-site.example install-app orb_launcher
bench build --app orb_launcher
bench --site your-site.example clear-cache
bench restart
```

For containerized deployments, include the app in your custom image or mount the app directory persistently into all required Frappe services. Ensure the public assets are available to the frontend/Nginx container.

## How it works

The client script waits for the standard Frappe Apps page, reads the user's permission-filtered ERPNext dock, and inserts launcher cards below the original app icons. Clicking a card invokes the same navigation logic used by Frappe's native sidebar.

Because the data comes from the current user's boot payload:

- hidden dock entries are not shown;
- the configured order is preserved;
- existing role and permission behavior remains unchanged.

## Customization

- Layout and colors: `orb_launcher/public/css/orb_launcher.css`
- Labels and rendering: `orb_launcher/public/js/orb_launcher.js`

## Uninstall

```bash
bench --site your-site.example uninstall-app orb_launcher
bench --site your-site.example clear-cache
bench restart
```

## License

MIT License. See [license.txt](license.txt).
