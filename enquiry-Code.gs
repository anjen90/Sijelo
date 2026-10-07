// Google Apps Script for the ENQUIRY form: saves each enquiry as a new row.
const SHEET_NAME = "Enquiries";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Timestamp", "Email", "Full name of student", "Mobile number", "Interested program", "Message"]);
      sheet.getRange("1:1").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 4).setNumberFormat("@"); // keep mobile as text
    sheet.getRange(row, 1, 1, 6).setValues([[
      new Date(),
      String(d.email || "").slice(0, 200),
      String(d.name || "").slice(0, 200),
      String(d.phone || "").slice(0, 20),
      String(d.program || "").slice(0, 100),
      String(d.message || "").slice(0, 1000)
    ]]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
