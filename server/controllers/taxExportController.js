import ExcelJS from "exceljs";
import Invoice from "../models/Invoice.js";

export const exportTaxReport = async (req, res) => {
  const { month, year, format = "csv" } = req.query;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const invoices = await Invoice.find({
    tenantId: req.user.tenantId,
    createdAt: { $gte: start, $lte: end },
    status: "paid",
  });

  const rows = invoices.map((inv) => ({
    InvoiceNumber: inv.invoiceNumber,
    Date: inv.createdAt.toISOString(),
    Subtotal: inv.subtotal,
    VAT: inv.taxAmount,
    Total: inv.amount,
    Currency: inv.currency,
  }));

  if (format === "xlsx") {
    // Use ExcelJS — actively maintained, no known prototype-pollution CVEs
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tax Report");

    // Header row
    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key,
        key,
        width: 20,
      }));
    } else {
      worksheet.columns = [
        { header: "InvoiceNumber", key: "InvoiceNumber", width: 20 },
        { header: "Date", key: "Date", width: 25 },
        { header: "Subtotal", key: "Subtotal", width: 15 },
        { header: "VAT", key: "VAT", width: 15 },
        { header: "Total", key: "Total", width: 15 },
        { header: "Currency", key: "Currency", width: 12 },
      ];
    }

    worksheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tax-report-${month}-${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    return res.end();
  }

  // CSV path — plain string building, no external library needed
  const headers = ["InvoiceNumber", "Date", "Subtotal", "VAT", "Total", "Currency"];
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=tax-report-${month}-${year}.csv`
  );
  res.send(csvLines.join("\n"));
};
