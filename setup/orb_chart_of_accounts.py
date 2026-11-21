"""ORB General Trading chart of accounts: one source for the importer CSV and the Arabic names.

Run: python3 setup/orb_chart_of_accounts.py  -> writes setup/orb_chart_of_accounts.csv
Columns follow ERPNext's Chart of Accounts Importer template.
"""
import csv, os

# (number, parent_number, is_group, account_type, root_type, currency, english, arabic)
A = [
 ("1000", None, 1, "", "Asset", "", "Assets", "الأصول"),
 ("1100", "1000", 1, "", "", "", "Current Assets", "الأصول المتداولة"),
 ("1110", "1100", 1, "Cash", "", "", "Cash", "النقدية"),
 ("1111", "1110", 0, "Cash", "", "AED", "Petty Cash - AED", "صندوق المصروفات النثرية - درهم"),
 ("1120", "1100", 1, "Bank", "", "", "Banks", "البنوك"),
 ("1121", "1120", 0, "Bank", "", "AED", "Emirates NBD - AED", "بنك الإمارات دبي الوطني - درهم"),
 ("1122", "1120", 0, "Bank", "", "USD", "Emirates NBD - USD", "بنك الإمارات دبي الوطني - دولار"),
 ("1123", "1120", 0, "Bank", "", "SAR", "SAR Bank Account", "حساب بنكي - ريال"),
 ("1124", "1120", 0, "", "", "AED", "Bank Margin on LC and LG", "تأمينات خطابات الاعتماد والضمان"),
 ("1130", "1100", 1, "Receivable", "", "", "Accounts Receivable", "العملاء (المدينون)"),
 ("1131", "1130", 0, "Receivable", "", "AED", "Debtors - AED", "العملاء - درهم"),
 ("1132", "1130", 0, "Receivable", "", "USD", "Debtors - USD", "العملاء - دولار"),
 ("1133", "1130", 0, "Receivable", "", "SAR", "Debtors - SAR", "العملاء - ريال"),
 ("1134", "1130", 0, "", "", "AED", "Post-Dated Cheques Received", "شيكات مؤجلة مستلمة"),
 ("1140", "1100", 1, "Payable", "", "", "Advances to Suppliers", "دفعات مقدمة للموردين"),
 ("1141", "1140", 0, "Payable", "", "USD", "Supplier Advances - USD", "دفعات مقدمة للموردين - دولار"),
 ("1142", "1140", 0, "Payable", "", "AED", "Supplier Advances - AED", "دفعات مقدمة للموردين - درهم"),
 ("1150", "1100", 1, "", "", "", "Prepayments and Deposits", "مصروفات مدفوعة مقدماً وتأمينات"),
 ("1151", "1150", 0, "", "", "AED", "Prepaid Expenses", "مصروفات مدفوعة مقدماً"),
 ("1152", "1150", 0, "", "", "AED", "Refundable Deposits", "تأمينات مستردة"),
 ("1153", "1150", 0, "", "", "AED", "Visa Deposits", "تأمينات التأشيرات"),
 ("1160", "1100", 0, "Tax", "", "AED", "VAT Input 5%", "ضريبة القيمة المضافة - مدخلات 5%"),
 ("1170", "1100", 1, "Stock", "", "", "Inventory", "المخزون"),
 ("1171", "1170", 0, "Stock", "", "AED", "Coffee Stock", "مخزون البن"),
 ("1180", "1100", 1, "", "", "", "Other Receivables", "أرصدة مدينة أخرى"),
 ("1181", "1180", 0, "", "", "AED", "Employee Advances", "سلف الموظفين"),
 ("1190", "1100", 0, "Temporary", "", "AED", "Temporary Opening", "حساب الأرصدة الافتتاحية المؤقت"),
 ("1200", "1000", 1, "", "", "", "Fixed Assets", "الأصول الثابتة"),
 ("1210", "1200", 0, "Fixed Asset", "", "AED", "Furniture and Office Equipment", "الأثاث ومعدات المكتب"),
 ("1220", "1200", 0, "Fixed Asset", "", "AED", "Computers", "أجهزة الكمبيوتر"),
 ("1230", "1200", 0, "Fixed Asset", "", "AED", "Vehicles", "السيارات"),
 ("1290", "1200", 0, "Accumulated Depreciation", "", "AED", "Accumulated Depreciation", "مجمع الإهلاك"),

 ("2000", None, 1, "", "Liability", "", "Liabilities", "الالتزامات"),
 ("2100", "2000", 1, "", "", "", "Current Liabilities", "الالتزامات المتداولة"),
 ("2110", "2100", 1, "Payable", "", "", "Accounts Payable", "الموردون (الدائنون)"),
 ("2111", "2110", 0, "Payable", "", "AED", "Creditors - AED", "الموردون - درهم"),
 ("2112", "2110", 0, "Payable", "", "USD", "Creditors - USD", "الموردون - دولار"),
 ("2113", "2110", 0, "Payable", "", "SAR", "Creditors - SAR", "الموردون - ريال"),
 ("2114", "2110", 0, "", "", "AED", "Post-Dated Cheques Issued", "شيكات مؤجلة صادرة"),
 ("2120", "2100", 1, "Receivable", "", "", "Advances from Customers", "دفعات مقدمة من العملاء"),
 ("2121", "2120", 0, "Receivable", "", "USD", "Customer Advances - USD", "دفعات مقدمة من العملاء - دولار"),
 ("2122", "2120", 0, "Receivable", "", "SAR", "Customer Advances - SAR", "دفعات مقدمة من العملاء - ريال"),
 ("2123", "2120", 0, "Receivable", "", "AED", "Customer Advances - AED", "دفعات مقدمة من العملاء - درهم"),
 ("2130", "2100", 1, "Tax", "", "", "VAT Liabilities", "ضريبة القيمة المضافة"),
 ("2131", "2130", 0, "Tax", "", "AED", "VAT Output 5%", "ضريبة القيمة المضافة - مخرجات 5%"),
 ("2132", "2130", 0, "Tax", "", "AED", "VAT Payable", "صافي ضريبة القيمة المضافة المستحقة"),
 ("2140", "2100", 0, "Tax", "", "AED", "Corporate Tax Payable 9%", "ضريبة الشركات المستحقة 9%"),
 ("2150", "2100", 1, "", "", "", "Accrued Expenses", "مصروفات مستحقة"),
 ("2151", "2150", 0, "", "", "AED", "Accrued Audit Fees", "أتعاب مراجعة مستحقة"),
 ("2152", "2150", 0, "", "", "AED", "Other Accrued Expenses", "مصروفات مستحقة أخرى"),
 ("2160", "2100", 0, "", "", "AED", "Salaries Payable", "رواتب مستحقة"),
 ("2170", "2100", 0, "Stock Received But Not Billed", "", "AED", "Stock Received But Not Billed", "بضاعة مستلمة لم تفوتر"),
 ("2180", "2100", 0, "", "", "AED", "Partners Current Account", "جاري الشركاء"),
 ("2190", "2100", 0, "", "", "AED", "Credit Notes to Customers", "إشعارات دائنة للعملاء"),
 ("2200", "2000", 1, "", "", "", "Non-Current Liabilities", "الالتزامات طويلة الأجل"),
 ("2210", "2200", 0, "", "", "AED", "End of Service Benefits Provision", "مخصص مكافأة نهاية الخدمة"),
 ("2220", "2200", 0, "", "", "AED", "Partners Loans", "قروض الشركاء"),

 ("3000", None, 1, "Equity", "Equity", "", "Equity", "حقوق الملكية"),
 ("3100", "3000", 0, "Equity", "", "AED", "Share Capital", "رأس المال"),
 ("3200", "3000", 0, "Equity", "", "AED", "Retained Earnings", "الأرباح المحتجزة"),
 ("3300", "3000", 0, "Equity", "", "AED", "Partners Drawings", "مسحوبات الشركاء"),

 ("4000", None, 1, "", "Income", "", "Income", "الإيرادات"),
 ("4100", "4000", 1, "Direct Income", "", "", "Green Coffee Sales", "مبيعات البن الأخضر"),
 ("4110", "4100", 0, "Income Account", "", "AED", "Export Sales", "مبيعات التصدير"),
 ("4120", "4100", 0, "Income Account", "", "AED", "Local Sales", "المبيعات المحلية"),
 ("4200", "4000", 1, "Indirect Income", "", "", "Other Income", "إيرادات أخرى"),
 ("4210", "4200", 0, "Income Account", "", "AED", "Discounts Received", "خصومات مكتسبة"),

 ("5000", None, 1, "Direct Expense", "Expense", "", "Cost of Sales", "تكلفة المبيعات"),
 ("5100", "5000", 0, "Cost of Goods Sold", "", "AED", "Cost of Coffee Sold", "تكلفة البن المباع"),
 ("5110", "5000", 0, "Stock Adjustment", "", "AED", "Stock Adjustment", "تسويات المخزون"),
 ("5120", "5000", 0, "Expenses Included In Valuation", "", "AED", "Expenses Included in Valuation", "مصروفات محملة على تكلفة البضاعة"),
 ("5200", "5000", 1, "", "", "", "Direct Trade Expenses", "مصروفات مباشرة على الصفقات"),
 ("5210", "5200", 0, "Chargeable", "", "AED", "Freight and Shipping", "الشحن والنقل"),
 ("5220", "5200", 0, "Chargeable", "", "AED", "Inspection and Certificates", "الفحص والشهادات"),
 ("5230", "5200", 0, "Chargeable", "", "AED", "Cargo Insurance", "تأمين البضاعة"),
 ("5240", "5200", 0, "Expense Account", "", "AED", "Sales Commissions", "عمولات المبيعات"),
 ("5250", "5200", 0, "Expense Account", "", "AED", "Trade Bank Charges", "مصاريف بنكية على الصفقات"),
 ("5260", "5200", 0, "Expense Account", "", "AED", "Demurrage and Port Charges", "الأرضيات ورسوم الموانئ"),

 ("6000", None, 1, "Indirect Expense", "Expense", "", "General and Administrative Expenses", "المصروفات العمومية والإدارية"),
 ("6100", "6000", 1, "", "", "", "Salaries and Benefits", "الرواتب والمزايا"),
 ("6110", "6100", 0, "Expense Account", "", "AED", "Salaries and Wages", "الرواتب والأجور"),
 ("6111", "6100", 0, "Expense Account", "", "AED", "Housing Allowance", "بدل السكن"),
 ("6112", "6100", 0, "Expense Account", "", "AED", "Leave Salary and Air Tickets", "رواتب الإجازات وتذاكر السفر"),
 ("6120", "6100", 0, "Expense Account", "", "AED", "End of Service Benefits", "مكافأة نهاية الخدمة"),
 ("6130", "6100", 0, "Expense Account", "", "AED", "Visa and Labour Fees", "التأشيرات ورسوم العمالة"),
 ("6140", "6100", 0, "Expense Account", "", "AED", "Medical Insurance", "التأمين الطبي"),
 ("6200", "6000", 1, "", "", "", "Office Expenses", "مصروفات المكتب"),
 ("6210", "6200", 0, "Expense Account", "", "AED", "Rent", "الإيجار"),
 ("6220", "6200", 0, "Expense Account", "", "AED", "Utilities (DEWA)", "الكهرباء والمياه"),
 ("6230", "6200", 0, "Expense Account", "", "AED", "Telephone and Internet", "الاتصالات والإنترنت"),
 ("6240", "6200", 0, "Expense Account", "", "AED", "Office Supplies", "الأدوات المكتبية"),
 ("6300", "6000", 1, "", "", "", "Government Fees", "الرسوم الحكومية"),
 ("6310", "6300", 0, "Expense Account", "", "AED", "Trade Licence Fees", "رسوم الرخصة التجارية"),
 ("6320", "6300", 0, "Expense Account", "", "AED", "Other Government Fees", "رسوم حكومية أخرى"),
 ("6400", "6000", 1, "", "", "", "Professional Fees", "الأتعاب المهنية"),
 ("6410", "6400", 0, "Expense Account", "", "AED", "Audit Fees", "أتعاب المراجعة"),
 ("6420", "6400", 0, "Expense Account", "", "AED", "Legal Fees", "الأتعاب القانونية"),
 ("6430", "6400", 0, "Expense Account", "", "AED", "Accounting and Consulting Fees", "أتعاب المحاسبة والاستشارات"),
 ("6500", "6000", 0, "Expense Account", "", "AED", "General Bank Charges", "المصاريف البنكية العامة"),
 ("6600", "6000", 0, "Expense Account", "", "AED", "Travel", "السفر والانتقالات"),
 ("6700", "6000", 0, "Expense Account", "", "AED", "Marketing and Advertising", "التسويق والدعاية"),
 ("6800", "6000", 0, "Depreciation", "", "AED", "Depreciation", "الإهلاك"),
 ("6900", "6000", 0, "", "", "AED", "Exchange Gain/Loss", "فروق العملة"),
 ("6901", "6000", 0, "", "", "AED", "Unrealized Exchange Gain/Loss", "فروق عملة غير محققة"),
 ("6910", "6000", 0, "Round Off", "", "AED", "Round Off", "فروق التقريب"),
 ("6920", "6000", 0, "Expense Account", "", "AED", "Bad Debts", "الديون المعدومة"),
 ("6930", "6000", 0, "Expense Account", "", "AED", "Write Off", "شطب الفروق"),

 ("7000", None, 1, "", "Expense", "", "Corporate Tax", "ضريبة الشركات"),
 ("7100", "7000", 0, "Tax", "", "AED", "Corporate Tax Expense 9%", "مصروف ضريبة الشركات 9%"),
]

# Advance accounts carry Receivable/Payable types on the opposite root (customer advances are a
# liability, supplier advances an asset). The importer picks the company's default receivable and
# payable account by type alone and rejects these, so they are imported untyped and typed after.
TYPED_AFTER_IMPORT = {"1140", "1141", "1142", "2120", "2121", "2122", "2123"}

if __name__ == "__main__":
    by_num = {a[0]: a for a in A}
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "orb_chart_of_accounts.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Account Name", "Parent Account", "Account Number", "Parent Account Number", "Is Group", "Account Type", "Root Type", "Account Currency"])
        for num, parent, grp, typ, root, cur, en, ar in A:
            if num in TYPED_AFTER_IMPORT:
                typ = ""
            w.writerow([en, by_num[parent][6] if parent else "", num, parent or "", grp, typ, root, cur])
    names = [a[6] for a in A]
    assert len(names) == len(set(names)), "duplicate account names"
    print(out, len(A), "accounts")
