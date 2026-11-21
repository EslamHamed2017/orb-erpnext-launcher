# ORB ERP setup data

Data used to set up company **ORB General Trading L.L.C** on the ERPNext site.

| File | What |
|---|---|
| `orb_chart_of_accounts.py` | The chart of accounts (number, type, currency, English and Arabic names). Run it to regenerate the CSV. |
| `orb_chart_of_accounts.csv` | Import file for ERPNext's *Chart of Accounts Importer* (109 accounts). |
| `orb-logo.png`, `orb-logo-transparent.png` | ORB logo, taken from the company's statement of account. |

Notes:
- Advance accounts (1141-1142, 2121-2123) are imported without an account type and set to
  Payable / Receivable afterwards; the importer would otherwise pick them as the default
  receivable / payable accounts and reject them.
- Arabic account names are stored as `Translation` records (language `ar`).
