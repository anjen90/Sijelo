// Sijelo Academy: one script for BOTH forms.
// Paste this same code into each Apps Script project (workshop sheet and enquiry sheet).
//
// If the script was created from the sheet (Extensions > Apps Script), leave SHEET_ID empty.
// If it was created at script.google.com (standalone), paste your Sheet ID here.
// The Sheet ID is the long text in the sheet URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
const SHEET_ID = "";

// Tab names inside each spreadsheet
const ENQUIRY_TAB  = "Enquiry_Form";
const WORKSHOP_TAB = "Workshop Registrations001";

function getSS_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Script is not linked to a sheet. Set SHEET_ID at the top of the script.");
  return ss;
}

function getTab_(name, headers) {
  const ss = getSS_();
  let sh = ss.getSheetByName(name);
  if (sh) {
    if (sh.getLastRow() === 0) sh.appendRow(headers);
    return sh;
  }
  // If the file only has one empty default tab (e.g. "Sheet1"), rename it instead of adding a new one
  const all = ss.getSheets();
  if (all.length === 1 && all[0].getLastRow() === 0) {
    sh = all[0];
    sh.setName(name);
  } else {
    sh = ss.insertSheet(name);
  }
  sh.appendRow(headers);
  sh.getRange("1:1").setFontWeight("bold");
  sh.setFrozenRows(1);
  return sh;
}

function save_(d) {
  const t = (v, n) => String(v || "").slice(0, n);
  if (d.program !== undefined) {
    // Enquiry form
    const sh = getTab_(ENQUIRY_TAB, ["Timestamp", "Email", "Full name of student", "Mobile number", "Interested program", "Message"]);
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 4).setNumberFormat("@");
    sh.getRange(row, 1, 1, 6).setValues([[new Date(), t(d.email, 200), t(d.name, 200), t(d.phone, 20), t(d.program, 100), t(d.message, 1000)]]);
  } else {
    // Workshop registration form
    const sh = getTab_(WORKSHOP_TAB, ["Timestamp", "Full name", "Email", "WhatsApp number", "Status"]);
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 4).setNumberFormat("@");
    sh.getRange(row, 1, 1, 5).setValues([[new Date(), t(d.name, 200), t(d.email, 200), t(d.phone, 20), "Sent to payment page"]]);
  }
}

// Open the /exec URL in a browser: you should see "running" if the deployment is live.
function doGet() {
  return ContentService.createTextOutput("Sijelo Academy script is running.");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    save_(d);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Run this once from the editor (select testRow > Run). It grants permissions and adds a test row.
function testRow() {
  save_({ name: "Test Student", email: "test@example.com", phone: "9999999999", program: "Art & Design", message: "Test row, safe to delete" });
  Logger.log("Test row added. Check the Enquiry_Form tab.");
}
