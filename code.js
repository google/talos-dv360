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
 * Add a custom menu to the active spreadsheet.
 * @param {Event} e The onOpen event.
 */
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Talos')
      .addItem('Download SDF', 'showStarterDialog')
      .addItem('Update SDF', 'updateSDF')
      .addItem('Send Email', 'sendEmail')
      .addSeparator()
      .addItem('3PAS Form', 'show3pasDialog')
      .addSeparator()
      .addItem('Clear Sheets', 'clearSheets')
      .addToUi();
}

/**
 * Show 3pas dialog.
 */
function show3pasDialog() {
  showDialog('3pas_dialog', '3PAS Tracker Config');
}

/**
 * Retrieve the ads.
 */
function retrieveAds3pas(
    selectedInputType, sourcePartnerIdVal, sourceIoIdVal, sourceCampaignIdVal) {
  // Rename sheet if it exists.
  if (checkSheetExists(CONFIG_SHEET_NAME_3PAS)) {
    var renameSuffix = parseInt(Math.random() * 100000).toString();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        CONFIG_SHEET_NAME_3PAS);
    sheet.setName(CONFIG_SHEET_NAME_3PAS + '-' + renameSuffix);
    sheet.hideSheet();
  }
  copyConfigSheet(MASTER_CONFIG_SHEET_3PAS, CONFIG_SHEET_NAME_3PAS);
  populateInitialDetails3pas(
      selectedInputType, sourcePartnerIdVal, sourceIoIdVal,
      sourceCampaignIdVal);

  var extractedData =
      fetchSdfData(sourcePartnerIdVal, sourceCampaignIdVal, sourceIoIdVal);
  if (!extractedData) {
    return;
  }

  var ioCsvData, lineitemCsvData, adGroupCsvData, adCsvData;

  extractedData.forEach(function(f) {
    var curData = Utilities.parseCsv(f.getDataAsString());

    switch (f.getName()) {
      case IO_SHEET_NAME:
        ioCsvData = curData;
        break;

      case LI_SHEET_NAME:
        lineitemCsvData = curData;
        break;

      case ADGROUP_SHEET_NAME:
        adGroupCsvData = curData;
        break;

      case AD_SHEET_NAME:
        adCsvData = curData;
        break;
    }
  });

  // var ioCsvData = Utilities.parseCsv(jsonData[IO_SHEET_NAME]);
  var ioHeading = ioCsvData[0];
  var ioData = ioCsvData.slice(1);

  // var lineitemCsvData = Utilities.parseCsv(jsonData[LI_SHEET_NAME]);
  var lineitemHeading = lineitemCsvData[0];
  var lineitemData = lineitemCsvData.slice(1);

  var ioIdsToKeep = removeNonTrueViewLineItems(lineitemData);
  removeNonTrueViewIOs(ioData, ioIdsToKeep);

  // var adGroupCsvData = Utilities.parseCsv(jsonData[ADGROUP_SHEET_NAME]);
  var adGroupHeading = adGroupCsvData[0];
  var adGroupData = adGroupCsvData.slice(1);

  // var adCsvData = Utilities.parseCsv(jsonData[AD_SHEET_NAME]);
  var adHeading = adCsvData[0];
  var adData = adCsvData.slice(1);

  var ioIndexed = getIndexedDataFromArray(ioData, ioHeading, 0, [1, 2]);
  var lineitemIndexed =
      getIndexedDataFromArray(lineitemData, lineitemHeading, 0, [1, 4]);
  var adGroupIndexed =
      getIndexedDataFromArray(adGroupData, adGroupHeading, 0, [1, 2]);
  var adIndexed =
      getIndexedDataFromArray(adData, adHeading, 0, [1, 2, 4, 5, 6, 7]);

  var configData =
      combineData3pas(adIndexed, adGroupIndexed, lineitemIndexed, ioIndexed);
  populateStage2Config3pas(configData);
}

function getDataFromRawCsv(rawCsv, idColumnIndex, columnIndices) {
  var dataRaw = Utilities.parseCsv(rawCsv);
  var dataHeading = dataRaw[0];
  var dataArr = dataRaw.slice(1);
  return getIndexedDataFromArray(
      dataArr, dataHeading, idColumnIndex, columnIndices);
}

function populateInitialDetails3pas(
    selectedInputType, sourcePartnerIdVal, sourceIoIdVal, sourceCampaignIdVal) {
  var curSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = curSpreadsheet.getSheetByName(CONFIG_SHEET_NAME_3PAS);
  configSheet.getRange('B2').setValue(sourcePartnerIdVal);
  if (selectedInputType === INSERTION_ORDER_ID) {
    configSheet.getRange('B4').setValue(sourceIoIdVal);
  } else {
    configSheet.getRange('B3').setValue(sourceCampaignIdVal);
  }
}

// TODO: Combine this one with the other function.
function combineData3pas(adData, adGroupData, lineitemData, ioData) {
  var finalData = [];
  var adIds = Object.keys(adData);
  adIds.forEach(function(adId) {
    var adRow = adData[adId];

    var adName = adRow['Name'];
    var adVideoId = adRow['Video Id'];
    var adDisplayUrl = adRow['Display Url'];

    var adGroupId = adRow['Ad Group Id'];
    console.log(adGroupData);
    var adGroupRow = adGroupData[adGroupId];
    var adGroupName = adGroupRow['Name'];
    console.log(adGroupName);

    var lineitemId = adGroupRow['Line Item Id'];
    var lineitemRow = lineitemData[lineitemId];
    var lineitemName = lineitemRow['Name'];

    var ioId = lineitemRow['Io Id'];
    var ioRow = ioData[ioId];
    var ioName = ioRow['Name'];

    var curRow = [
      ioName, lineitemName, adGroupName, adName, lineitemId, adGroupId, adId
    ];
    finalData.push(curRow);
  });
  return finalData;
}

// Define function that populates ad structure
function populateStage2Config3pas(configData) {
  // define range of A1Notation for populating values in config sheet
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      CONFIG_SHEET_NAME_3PAS);
  var configRangeA1Notation = 'A7:G';
  configSheet.getRange(configRangeA1Notation).clear();

  var numRows = configData.length;

  var configRange = configSheet.getRange(7, 1, numRows, 7);
  configRange.clearFormat();

  configRange.clearDataValidations();
  configRange.setValues(configData);

  SpreadsheetApp.flush();  // Finish updating before resizing column widths.

  configSheet.getRange(configRangeA1Notation).clearDataValidations();
}

/**
 * Show the starter dialog to get the input ids.
 */
function showStarterDialog() {
  var isConfigExists = checkSheetExists(CONFIG_SHEET_NAME);
  if (isConfigExists) {
    showToast(
        'Using existing config. Please run Talos > ClearSheets if you want to start fresh.');
    startProcessing(false);
  } else {
    showDialog('starter_dialog', 'Input Configuration');
  }
}

/**
 * Show a dialog box.
 * @param {string} dialogName The name of the dialog box html file.
 */
function showDialog(dialogName, dialogTitle) {
  var template = HtmlService.createTemplateFromFile(dialogName)
                     .evaluate()
                     .setWidth(300)
                     .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(template, dialogTitle);
}

/**
 * Processing begins here.
 * @param {boolean} isNewConfig Whether this is a new config or not.
 * @param {string} selectedInputType Are we fetching from IO or campaign ID.
 * @param {string} emailVal Email address of user.
 * @param {?string|undefined} sourceIoIdVal Source IO ID to fetch.
 * @param {?string|undefined} sourceCampaignIdVal Campaign ID to fetch.
 * @param {?string|undefined} destinationCampaignIdVal Destination Campaign ID
 *     to upload the SDF files to.
 * @return {void}
 */
function startProcessing(
    isNewConfig, selectedInputType, emailVal, sourcePartnerIdVal, sourceIoIdVal,
    sourceCampaignIdVal, destinationCampaignIdVal) {
  if (isNewConfig) {
    copyConfigSheet(MASTER_CONFIG_SHEET, CONFIG_SHEET_NAME);
    populateInitialDetails(
        selectedInputType, emailVal, sourcePartnerIdVal, sourceIoIdVal,
        sourceCampaignIdVal, destinationCampaignIdVal);
  }
  fetchSdfFiles();
}

/**
 * Populate the config sheet details after copying it over from master.
 * @param {string} selectedInputType Are we fetching from IO or campaign ID.
 * @param {string} emailVal Email address of user.
 * @param {?string|undefined} sourceIoIdVal Source IO ID to fetch.
 * @param {?string|undefined} sourceCampaignIdVal Campaign ID to fetch.
 * @param {?string|undefined} destinationCampaignIdVal Destination Campaign ID
 *     to upload the SDF files to.
 */
function populateInitialDetails(
    selectedInputType, emailVal, sourcePartnerIdVal, sourceIoIdVal,
    sourceCampaignIdVal, destinationCampaignIdVal) {
  var curSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = curSpreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  configSheet.getRange('C10').setValue(emailVal);
  configSheet.getRange('C11').setValue(sourcePartnerIdVal);

  if (selectedInputType === INSERTION_ORDER_ID) {
    configSheet.getRange('C13').setValue(sourceIoIdVal);
    configSheet.getRange('C14').setValue(destinationCampaignIdVal);
  } else {
    configSheet.getRange('C12').setValue(sourceCampaignIdVal);
    // Source and destination are the same if campaign is selected.
    configSheet.getRange('C14').setValue(sourceCampaignIdVal);
  }
}

/**
 * Copy the config sheet from the master sheet to the current one.
 * @param {string} configSpreadsheetId Spreadsheet ID for config sheet.
 * @param {string} configSheetName Name of the sheet in the given spreadsheet.
 */
function copyConfigSheet(configSpreadsheetId, configSheetName) {
  showToast('Creating config sheet.');
  var curSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SpreadsheetApp.openById(configSpreadsheetId)
                  .getSheetByName(configSheetName);

  var newSheet = sheet.copyTo(curSpreadsheet);
  curSpreadsheet.setActiveSheet(newSheet);
  curSpreadsheet.moveActiveSheet(1);
  curSpreadsheet.setActiveSheet(newSheet);
  newSheet.setName(configSheetName);
}

/**
 * Get the input IO and campaign ids from the config sheet.
 * @return {!Object} The object containing the input values.
 */
function getInitialInputValues() {
  var obj = {};
  var curSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = curSpreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  var inputValues = configSheet.getRange('C11:C14').getValues();
  var sourcePartnerId = inputValues[0][0];
  var sourceCampaignId = inputValues[1][0];
  var sourceIoId = inputValues[2][0];
  var destinationCampaignId = inputValues[3][0];

  obj[SOURCE_PARTNER_ID] = sourcePartnerId;
  obj[SOURCE_CAMPAIGN_ID] = sourceCampaignId;
  obj[SOURCE_IO_ID] = sourceIoId;
  obj[DESTINATION_CAMPAIGN_ID] = destinationCampaignId;
  return obj;
}

/**
 * Fetch SDF files based on the input config.
 */
function fetchSdfFiles() {
  showToast('Downloading SDF files.');


  var obj = getInitialInputValues();
  var sourcePartnerId = obj[SOURCE_PARTNER_ID];
  var sourceCampaignId = obj[SOURCE_CAMPAIGN_ID];
  var sourceIoId = obj[SOURCE_IO_ID];

  var extractedData =
      fetchSdfData(sourcePartnerId, sourceCampaignId, sourceIoId);

  var renameSuffix = parseInt(Math.random() * 100000).toString();

  // Put the sheets in heirarchical order.
  SHEETS_ORDER.forEach(function(s) {
    extractedData.forEach(function(f) {
      var csvName = f.getName();
      if (csvName === s) {
        var csvData = f.getDataAsString();
        if (csvData) {
          insertData(csvData, csvName, renameSuffix);
          // console.log(csvName);
          // console.log(csvData);
        }
      }
    });
  });

  removeNonTrueViewRows();
  generateStage2Config();
}

/**
 * Fetch the sdf raw data.
 */
function fetchSdfData(partnerId, campaignId, IoId) {
  var createUrl = 'https://displayvideo.googleapis.com/' + DV360_API_VERSION +
      '/sdfdownloadtasks';
  var statusUrl =
      'https://displayvideo.googleapis.com/' + DV360_API_VERSION + '/';
  var mediaUrl = 'https://displayvideo.googleapis.com/download/';

  var filterType = IO_FILTER_TYPE;
  var filterIds = IoId.split(',');
  if (!IoId) {
    filterType = CAMPAIGN_FILTER_TYPE;
    filterIds = [campaignId];
  }

  var params = {
    partnerId: partnerId,
    parentEntityFilter:
        {fileType: FILE_TYPES, filterIds: filterIds, filterType: filterType},
    version: SDF_VERSION
  };

  var createResp = callApi(createUrl, 'POST', params, false);
  var createTaskId = createResp['name'];
  var getStatusUrl = statusUrl + createTaskId;
  var getStatusResp = callApi(getStatusUrl, 'GET', null, false);
  while (!('done' in getStatusResp) || getStatusResp['done'] != true) {
    showToast('Waiting for process to complete');
    Utilities.sleep(2000);
    getStatusResp = callApi(getStatusUrl, 'GET', null, false);
  }
  var mediaTaskId = getStatusResp['response']['resourceName'];
  var mediaDownloadUrl = mediaUrl + mediaTaskId + '?alt=media';
  var respBlob = callApi(mediaDownloadUrl, 'GET', null, true);
  // Set the content type. This is required for unzipping.
  var respZipBlob = Utilities.newBlob(respBlob.getBytes(), 'application/zip');
  var extractedData = Utilities.unzip(respZipBlob);

  return extractedData;
}

/**
 * Remove non trueview lineitems and insertion orders.
 */
function removeNonTrueViewRows() {
  showToast('Removing non true-view rows.');
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var lineitemSheet = spreadsheet.getSheetByName(LI_SHEET_NAME);
  var lastRow = lineitemSheet.getLastRow();
  var lastCol = lineitemSheet.getLastColumn();

  var lineitemHeader = lineitemSheet.getRange(1, 1, 1, lastCol).getValues();
  var lineitemValues =
      lineitemSheet.getRange(2, 1, lastRow, lastCol).getValues();


  // First remove all the line items.
  var ioIdsToKeep = removeNonTrueViewLineItems(lineitemValues);

  lineitemSheet.clear();
  lineitemSheet.getRange(1, 1, lineitemValues.length + 1, lastCol)
      .setValues(lineitemHeader.concat(lineitemValues));

  var ioSheet = spreadsheet.getSheetByName(IO_SHEET_NAME);
  lastRow = ioSheet.getLastRow();
  lastCol = ioSheet.getLastColumn();

  var ioHeader = ioSheet.getRange(1, 1, 1, lastCol).getValues();
  var ioValues = ioSheet.getRange(2, 1, lastRow, lastCol).getValues();

  removeNonTrueViewIOs(ioValues, ioIdsToKeep);


  ioSheet.clear();
  ioSheet.getRange(1, 1, ioValues.length + 1, lastCol)
      .setValues(ioHeader.concat(ioValues));
}

function removeNonTrueViewLineItems(lineitemValues) {
  var ioIdsToKeep = [];
  var i = lineitemValues.length;

  while (i--) {
    if (lineitemValues[i][2] !== TRUEVIEW_TYPE) {
      lineitemValues.splice(i, 1);
    } else {
      // Keep the IO Ids that are trueview.
      var curIoId = lineitemValues[i][1];
      if (ioIdsToKeep.indexOf(curIoId) < 0) {
        ioIdsToKeep.push(lineitemValues[i][1]);
      }
    }
  }
  return ioIdsToKeep;
}

function removeNonTrueViewIOs(ioValues, ioIdsToKeep) {
  i = ioValues.length;

  while (i--) {
    if (ioIdsToKeep.indexOf(ioValues[i][0]) < 0) {
      ioValues.splice(i, 1);
    }
  }
}

/**
 * Insert the CSV data obtained from SDF API.
 * @param {string} csvString The CSV in a string format.
 * @param {string} sheetName The name of the target sheet.
 * @param {string} renameSuffix The string to rename the target
 *     sheet if it exists.
 */
function insertData(csvString, sheetName, renameSuffix) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var csvData = Utilities.parseCsv(csvString);

  var numRows = csvData.length;
  var numCols = csvData[0].length;
  // Check if has more rows than just heading row.
  if (numRows > 1) {
    var cursheet = spreadsheet.getSheetByName(sheetName);
    if (cursheet) {
      cursheet.setName(sheetName + '-' + renameSuffix);
      spreadsheet.toast('Renaming existing file');
      cursheet.hideSheet();
    }

    var newSheet = spreadsheet.insertSheet(sheetName);

    try {
      var inputRange = newSheet.getRange(1, 1, numRows, numCols);
      inputRange.setValues(csvData);
      SpreadsheetApp.flush();
    } catch (e) {
      // There is some cell which has > 50,000 chars.
      // Go line by line now.
      newSheet.clear();
      var tooBigSheet = spreadsheet.getSheetByName(TOO_BIG_SHEET);
      if (tooBigSheet) {
        tooBigSheet.setName(TOO_BIG_SHEET + '-' + renameSuffix);
        spreadsheet.toast('Renaming existing file');
        tooBigSheet.hideSheet();
      }
      tooBigSheet = spreadsheet.insertSheet(TOO_BIG_SHEET);
      for (var i = 0; i < numRows; i++) {
        try {
          var rowRange = newSheet.getRange(i + 1, 1, 1, numCols);
          rowRange.setValues(csvData[i]);
        } catch (e) {
          // This row has some cell which has >50,000 chars.
          for (var j = 0; j < numCols; j++) {
            var cur_csv_val = csvData[i][j];
            var cur_val;
            if (cur_csv_val.length < 50000) {
              cur_val = csvData[i][j];
            } else {
              cur_val_splits = cur_csv_val.match(/.{1,50000}/g);

              var lastRow = tooBigSheet.getLastRow();
              var tooBigRange = tooBigSheet.getRange(
                  lastRow + 1, 1, 1, cur_val_splits.length);
              for (var k = 0; k < cur_val_splits.length; k++) {
                tooBigRange.getCell(1, k + 1).setValue(cur_val_splits[k]);
              }
              cur_val = TOO_BIG_SHEET + '!' + tooBigRange.getA1Notation();
            }
            rowRange.getCell(1, j + 1).setValue(cur_val);
          }
        }
      }

      if (sheetName === LI_SHEET_NAME) {
        // Fix the date format in Range H:I.
        fixDateFormat(newSheet.getRange('H:I'));
      }
      if (sheetName === CAMPAIGN_SHEET_NAME) {
        // Fix the date format in Range K:L.
        fixDateFormat(newSheet.getRange('K:L'));
      }
    }
  }
}

/**
 * Combines the ads, adgroups, lineitems and insertion orders into one object.
 * This is then used to populate the stage 2 config.
 * @param {!Object} adData Data from the ad sheet.
 * @param {!Object} adGroupData Data from the ad group sheet.
 * @param {!Object} lineitemData Data from the line items sheet.
 * @param {!Object} ioData Data from the insertion orders sheet.
 * @return {!Object} Object containing the combined data.
 */
function combineData(adData, adGroupData, lineitemData, ioData) {
  var finalData = [];
  var adIds = Object.keys(adData);
  adIds.forEach(function(adId) {
    var adRow = adData[adId];

    var adName = adRow['Name'];
    var adVideoId = adRow['Video Id'];
    var adDisplayUrl = adRow['Display Url'];

    var adGroupId = adRow['Ad Group Id'];
    var adGroupRow = adGroupData[adGroupId];
    var adGroupName = adGroupRow['Name'];
    Logger.log(adGroupName);

    var lineitemId = adGroupRow['Line Item Id'];
    var lineitemRow = lineitemData[lineitemId];
    var lineitemName = lineitemRow['Name'];

    var ioId = lineitemRow['Io Id'];
    var ioRow = ioData[ioId];
    var ioName = ioRow['Name'];

    var curRow = [ioName, lineitemName, adGroupName, adName, adId];
    finalData.push(curRow);
  });
  return finalData;
}

/**
 * Populates the stage 2 config data obtained from combining all the sheets
 * data.
 * @param {!Object} configData Combined sheet data.
 */
function populateStage2Config(configData) {
  // TODO: Define range of A1Notation for populating values in config sheet.
  var configSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  var configRangeA1Notation = 'G11:U';
  configSheet.getRange(configRangeA1Notation).clear();

  var numRows = configData.length;

  var configRange = configSheet.getRange(11, 7, numRows, 5);
  configRange.clearFormat();

  configRange.clearDataValidations();
  configRange.setValues(configData);

  SpreadsheetApp.flush();  // Finish updating before resizing column widths.
  configSheet.autoResizeColumns(7, 13);

  configSheet.getRange(configRangeA1Notation).clearDataValidations();
}

/**
 * Initiate the processing for generating stage 2 config.
 */
function generateStage2Config() {
  var ioData = getData(IO_SHEET_NAME, 0, [1, 2]);
  var lineitemData = getData(LI_SHEET_NAME, 0, [1, 4]);
  var adGroupData = getData(ADGROUP_SHEET_NAME, 0, [1, 2]);
  var adData = getData(AD_SHEET_NAME, 0, [1, 2, 4, 5, 6, 7]);

  var configData = combineData(adData, adGroupData, lineitemData, ioData);
  populateStage2Config(configData);
}

/**
 * Removes empty rows from a sheet range.
 * @param {Range} data The range which needs the empty rows removed.
 */
function cleanRangeData(data) {
  var isEmpty = true;
  for (var i = data.length - 1; i >= 0; i--) {
    var curRow = data[i];
    for (var j = 0; j < curRow.length; j++) {
      if (curRow[j].toString().trim()) {
        isEmpty = false;
        break;
      }
    }
    if (!isEmpty) {
      break;
    } else {
      data.pop();
    }
  }
}

/**
 * Populate the ads sheet using the config data.
 * @param {!Object} configData The configuration data object.
 */
function populateAdsSheet(configData) {
  var adsSheetRange = 'A2:Q';
  var adsSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AD_SHEET_NAME);
  var adsData = adsSheet.getRange(adsSheetRange).getValues();
  cleanRangeData(adsData);
  // configData and adsData should have the same number of rows and should be
  // in the same order. This may not always be the case.
  // TODO: Make this more robust.
  for (var i = 0; i < adsData.length; i++) {
    // TODO: Remove hardcoding here.
    adsData[i][2] = configData[i][0];   // Ad Name
    adsData[i][4] = configData[i][1];   // Video Id
    adsData[i][5] = configData[i][2];   // Display Url
    adsData[i][6] = configData[i][3];   // Landing Page Url
    adsData[i][7] = configData[i][4];   // DCM Tracking - Placement Id
    adsData[i][8] = configData[i][5];   // DCM Tracking - Ad Id
    adsData[i][9] = configData[i][6];   // DCM Tracking - Creative Id
    adsData[i][10] = configData[i][7];  // Click tracking URL
    adsData[i][12] = configData[i][8];  // CTA
    adsData[i][13] = configData[i][9];  // Headline
  }
  adsSheet.getRange(2, 1, adsData.length, 17).setValues(adsData);
}

/**
 * Called after user makes changes to the stage 2 config.
 */
function updateStage2Config() {
  // Insert validation function here.
  var inputRange = 'L11:U';
  var configSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  var inputData = configSheet.getRange(inputRange).getValues();
  cleanRangeData(inputData);
  if (!inputData || inputData.length <= 0) {
    showAlert(
        'Error: Can\'t update SDF',
        'Please check that:\n\n 1. You have downloaded SDF succesfully\n2. You have updated the orange columns (Column L onwards)');
    return false;
  }
  populateAdsSheet(inputData);
  return true;
}

/**
 * Deletes all the sheets in the spreadsheet.
 */
function clearSheets() {
  var isProceed = shouldContinue('Are you sure you want to delete SDF sheets?');
  if (isProceed) {
    var curSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    // TODO: Check if configuration sheet doesn't exist and insert the sheet
    // below.
    // curSpreadsheet.insertSheet(0);
    var allSheets = curSpreadsheet.getSheets();
    for (var i = 1; i < allSheets.length; i++) {
      var sheetName = allSheets[i].getName().toLowerCase();
      if (sheetName.indexOf(CONFIG_SHEET_NAME.toLowerCase()) < 0 &&
          sheetName.indexOf(CONFIG_SHEET_NAME_3PAS.toLowerCase()) < 0) {
        SpreadsheetApp.getActiveSpreadsheet().deleteSheet(allSheets[i]);
      }
    }
  }
}
