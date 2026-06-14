function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data;

  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return errorResponse('Invalid JSON');
  }

  var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  var employee = data.employee || '';
  var expenseType = data.expenseType || '';
  var amount = data.amount || '';
  var receiptLink = '';
  var receiptName = data.receiptName || '';

  if (data.receiptData) {
    try {
      var receiptData = data.receiptData;
      var base64Data = receiptData.indexOf('base64,') !== -1
        ? receiptData.split('base64,')[1]
        : receiptData;

      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, data.receiptMimeType || 'image/jpeg', receiptName || 'receipt.jpg');

      var folderName = 'مرفقات المصروفات';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      var file = folder.createFile(blob);
      receiptLink = file.getUrl();
    } catch (err) {
      receiptLink = 'خطأ في رفع الصورة: ' + err.toString();
    }
  }

  var headerRow = 1;
  var lastRow = sheet.getLastRow();

  if (lastRow < headerRow) {
    sheet.getRange('A1:E1').setValues([['التاريخ', 'الموظف', 'نوع المصروف', 'المبلغ', 'صورة الإيصال']]);
    sheet.setFrozenRows(1);
    lastRow = 1;
  }

  sheet.appendRow([timestamp, employee, expenseType, amount, receiptLink]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'تم التسجيل بنجاح' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'التطبيق يعمل' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange('A1:E1').setValues([['التاريخ', 'الموظف', 'نوع المصروف', 'المبلغ', 'صورة الإيصال']]);
  sheet.setFrozenRows(1);
  sheet.getRange('A1:E1').setFontWeight('bold');
}