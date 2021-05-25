// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Send email to the active user.
 */
function sendEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var csvFiles = [];
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getSheetName();

    // Only include SDF files.
    if (sheetName !== CAMPAIGN_SHEET_NAME && sheetName !== IO_SHEET_NAME &&
        sheetName !== LI_SHEET_NAME && sheetName !== AD_SHEET_NAME &&
        sheetName !== ADGROUP_SHEET_NAME) {
      continue;
    }

    var sheet = sheets[i];
    // append ".csv" extension to the sheet name
    var fileName = sheet.getName();
    // convert all available sheet data to csv format
    var csvFile = convertRangeToCsvFile(fileName, sheet);
    Logger.log(csvFile);
    var csvData = {
      'fileName': fileName,
      'contents': csvFile,
    };
    csvFiles.push(csvData);
  }
  console.log(csvFiles);
  createEmail(csvFiles);
}


/**
 * Converts a given sheet to csv file.
 * @param {string} csvFileName The name of the csv file.
 * @param {Sheet} sheet The sheet object.
 * @return {string} The csv file in a string form.
 */
function convertRangeToCsvFile(csvFileName, sheet) {
  // get available data range in the spreadsheet
  var activeRange = sheet.getDataRange();
  Logger.log('convert: ' + csvFileName);
  try {
    var data = activeRange.getDisplayValues();
    var csvFile = undefined;

    // loop through the data in the range and build a string with the csv data
    Logger.log('length : ' + data.length);
    if (data.length > 0) {
      var csv = '';
      for (var row = 0; row < data.length; row++) {
        Logger.log('row: ' + row);
        for (var col = 0; col < data[row].length; col++) {
          Logger.log('col: ' + col);

          if (data[row][col].indexOf('TooBig') > -1) {
            // Replace with the value from the TooBig sheet.
            var tooBigValues = SpreadsheetApp.getActiveSpreadsheet()
                                   .getRange(data[row][col])
                                   .getValues()[0];
            var actualValues = '';
            for (var p = 0; p < tooBigValues.length; p++) {
              actualValues += tooBigValues[p];
            }
            data[row][col] = actualValues;
          }

          if (data[row][col].toString().indexOf('"') != -1 ||
              data[row][col].toString().indexOf(',') != -1) {
            data[row][col] = '"' + data[row][col].replace('"', '""') + '"';
            Logger.log('parsed: ' + data[row][col]);
          }
        }

        // join each row's columns
        // add a carriage return to end of each row, except for the last one
        if (row < data.length - 1) {
          csv += data[row].join(',') + '\r\n';
        } else {
          csv += data[row];
        }
      }
      csvFile = csv;
    }
    Logger.log('csvFile' + csvFile);
    return csvFile;
  } catch (err) {
    Logger.log(err);
    Browser.msgBox(err);
  }
}

/**
 * Creates an email with the csv files as a zip attachment.
 * @param {Array<string>} csvFiles The array of csv files to send in the email.
 */
function createEmail(csvFiles) {
  var dateLocale =
      new Date().toLocaleString();  // e.g. "21/11/2016, 08:00:00 AM"
  // user name and email
  var configSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  var configValues = configSheet.getRange('B10:C10').getValues();
  var username = configValues[0][0];
  var useremail = configValues[0][1];

  var sdfInitialConfig = getInitialInputValues();
  var campaignId = sdfInitialConfig[DESTINATION_CAMPAIGN_ID];
  var sourceIoId = sdfInitialConfig[SOURCE_IO_ID];

  // retrieve either advertiser or campaign id
  if (!sourceIoId) {
    var campaignSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        CAMPAIGN_SHEET_NAME);
    var advertiserID = campaignSheet.getRange('B2').getValue();
  } else {
    var campaignId = campaignId;
  }

  // Assign The Spreadsheet,Sheet,Range to variables
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets();

  // Authentification
  var params = {
    method: 'GET',
    headers: {'authorization': 'Bearer ' + ScriptApp.getOAuthToken()}
  };

  // Send Email
  var DV360URL = 'https://displayvideo.google.com/';

  if (!sourceIoId) {
    var subject = 'Talos SDF Download - AdvertiserID = ' + advertiserID +
        ' - Date Generated: ' + dateLocale;
    var body =
        '****Your SDF files are ready to be uploaded into DV360 for Advertiser ID =' +
        advertiserID + '. Click here to upload into DV360: ' + DV360URL +
        ' ****';
  } else {
    var subject = 'Talos SDF Download - CampaignID = ' + campaignId +
        ' - Date Generated: ' + dateLocale;
    var body =
        '****Your SDF files are ready to be uploaded into DV360 for Campaign ID =' +
        campaignId + '. Click here to upload into DV360: ' + DV360URL + ' ****';
  }
  var attachments = createAttachments(csvFiles);
  var zip = Utilities.zip(attachments, 'sdf_files_by_talos.zip');
  MailApp.sendEmail(
      {to: useremail, subject: subject, htmlBody: body, attachments: zip});
}

/**
 * Creates attachments fo the csv files.
 * @param {Array<string>} csvFiles The array of csv files.
 * @return {Array<Blob>} The csv files in an array of blobs.
 */
function createAttachments(csvFiles) {
  var attachments = [];
  for (var i = 0; i < csvFiles.length; i++) {
    var csvFile = csvFiles[i];
    var file =
        Utilities.newBlob(csvFile.contents, 'text/csv', csvFile.fileName);
    attachments.push(file);
  }
  return attachments;
}
