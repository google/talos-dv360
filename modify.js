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
 * Read the configuration from the config sheet.
 * @return {!Object} The configuration data in an object.
 */
function getSdfCampaignConfig() {
  var configSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  var values = configSheet.getRange('C18:C28').getValues();
  var obj = {};
  obj[CAMPAIGN_NAME] = values[0][0];
  obj[IO_NAME] = values[1][0];
  obj[START_DATE] = values[2][0];
  obj[END_DATE] = values[3][0];
  obj[IO_BUDGET] = values[4][0];
  obj[GEO_ID] = values[6][0];
  obj[CPV] = values[7][0];
  obj[CPM] = values[8][0];
  obj[CPA] = values[9][0];
  // User is able to select if they are creating a new campaign or modifying an
  // existing campaign
  obj[CREATION] = values[10][0];
  console.log(CREATION)
  return obj;
}

/**
 * Updates all the sdf sheets based on the configuration options.
 */
function updateSDF() {
  if (!updateStage2Config()) {
    return;
  }
  var sdfInitialConfig = getInitialInputValues();
  var sourceIoId = sdfInitialConfig[SOURCE_IO_ID];
  var sdfCampaignConfig = getSdfCampaignConfig();
  var ioBudget = sdfCampaignConfig[IO_BUDGET];

  if (!sourceIoId) {
    campaignSheetUpdate();
  }
  insertionOrderSheetUpdate();
  lineItemSheetUpdate();
  adGroupSheetUpdate();
  adSheetUpdate();
}

/**
 * Update the campaign sheet with the config data.
 */
function campaignSheetUpdate() {
  var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAMPAIGN_SHEET_NAME);
  // define range
  var sdfCampaignConfig = getSdfCampaignConfig();
  var campaignName = sdfCampaignConfig[CAMPAIGN_NAME];
  var cpv = sdfCampaignConfig[CPV];
  var startDate = sdfCampaignConfig[START_DATE];
  var endDate = sdfCampaignConfig[END_DATE];
  var geoId = sdfCampaignConfig[GEO_ID];
  var creation = sdfCampaignConfig[CREATION]

  startRow = 2;
  startColumn = 1;
  lastRow = sheet.getLastRow();
  lastColumn = sheet.getLastColumn();

  range = sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn);

  var currentValues =
      sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn)
          .getValues();

  for (i = 0; i < currentValues.length; i++) {
    row = currentValues[i];

    // campaign id
    if (creation) row[0] = 'ext' + row[0];
    // campaign name
    if (campaignName) row[2] = campaignName;
    // timestamp
    if (creation) row[3] = '';
    // cpv
    if (cpv) row[7] = cpv;
    // startdates in HH:mm
    if (startDate) row[10] = formatDate(startDate);
    // enddates in HH:mm
    if (endDate) row[11] = formatDate(endDate);
    // geo
    if (geoId) row[20] = geoId;

    sheet.getRange(startRow + i, startColumn, 1, lastColumn).setValues([row]);
  }
}

/**
 * Update the insertion order sheet with the config data.
 */
function insertionOrderSheetUpdate() {
  var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IO_SHEET_NAME);
  var sdfInitialConfig = getInitialInputValues();
  var campaignId = sdfInitialConfig[DESTINATION_CAMPAIGN_ID];
  var sourceIoId = sdfInitialConfig[SOURCE_IO_ID];

  var sdfCampaignConfig = getSdfCampaignConfig();
  var ioName = sdfCampaignConfig[IO_NAME];
  var ioBudget = sdfCampaignConfig[IO_BUDGET];
  var startDate = sdfCampaignConfig[START_DATE];
  var endDate = sdfCampaignConfig[END_DATE];
  var geoId = sdfCampaignConfig[GEO_ID];
  var creation = sdfCampaignConfig[CREATION]

  startRow = 2;
  startColumn = 1;
  lastRow = sheet.getLastRow();
  lastColumn = sheet.getLastColumn();

  range = sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn);

  var currentValues =
      sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn)
          .getValues();

  for (i = 0; i < currentValues.length; i++) {
    row = currentValues[i];

    // io id
    if (creation) row[0] = 'ext' + row[0];
    // if downloaded "campaign" level SDF, then add ext to insertionorder
    // else downloaded "insertionorder" level SDF, then input previous
    // campaignID
    if (!sourceIoId && creation) {
      row[1] = 'ext' + row[1];
    } else {
      row[1] = campaignId;
    }
    // io name
    if (sourceIoId) {
      if (ioName) row[2] = ioName;
    }
    // timestamp
    if (creation) row[3] = '';
    // budget
    if (startDate && endDate)
      row[22] = ioBudgetFormat(ioBudget, startDate, endDate);
    // geo
    if (geoId) row[24] = geoId;
    sheet.getRange(startRow + i, startColumn, 1, lastColumn).setValues([row]);
  }
}

/**
 * Update the line item sheet with the config data.
 */
function lineItemSheetUpdate() {
  var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LI_SHEET_NAME);
  var sdfCampaignConfig = getSdfCampaignConfig();
  var startDate = sdfCampaignConfig[START_DATE];
  var endDate = sdfCampaignConfig[END_DATE];
  var geoId = sdfCampaignConfig[GEO_ID];
  var ioBudget = sdfCampaignConfig[IO_BUDGET];
  var cpa = sdfCampaignConfig[CPA];
  var creation = sdfCampaignConfig[CREATION]

      var startRow = 2;
  var startColumn = 1;
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  var range = sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn);

  var currentValues =
      sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn)
          .getValues();

  for (i = 0; i < currentValues.length; i++) {
    row = currentValues[i];

    // li id
    if (creation) row[0] = 'ext' + row[0];
    // io id
    if (creation) row[1] = 'ext' + row[1];
    // timestamp
    if (creation) row[5] = '';
    // startDate
    row[7] = 'Same as Insertion Order';
    // endDate
    row[8] = 'Same as Insertion Order';
    // pacingAmount
    if (creation && startDate && endDate && ioBudget)
      row[13] = (dailyBudget(startDate, endDate, lastRow, ioBudget));
    // For the Target CPA bid strategy type, choose a value for the target bid.
    // For the other "TrueView Bid Strategy Type" values or non-TrueView line
    // items, this column should be 0 when uploading.
    var indexOffset = 0;
    if (SDF_VERSION == 'SDF_VERSION_5_3') {
      //SDF version 5.3 has more fields so need to adjust the offset
      indexOffset = 2;
    }

    if (row[93 + indexOffset] === 'Target CPA' && cpa) {
      row[94 + indexOffset] = cpa;
    } else if (row[93 + indexOffset] === 'Maximum Conversions') {
      row[94 + indexOffset] = 0;
    }  // Otherwise leave it at default.
    // geo
    if (geoId) {
      row[36] = geoId;
    }

    sheet.getRange(startRow + i, startColumn, 1, lastColumn).setValues([row]);
  }
}

/**
 * Get the 'TrueView Bid Strategy Type' by lineitem id.
 * @return {!Object} Key value pair of lineitem id and bid strategy type.
 */
function getLineitemBidStrategyType() {
  var lineitemIdIndex = 0;
  /**
   * Update column index for bidstrategy type here. Last updated v5.3 6th April
   * 2021
   */
  var indexOffset = 0;
  if (SDF_VERSION == 'SDF_VERSION_5_3') {
    //SDF version 5.3 has more fields so need to adjust the offset
    indexOffset = 2;
  }
  
  var trueviewBidStrategyTypeIndex = 93 + indexOffset;
  return getData(
      LI_SHEET_NAME, lineitemIdIndex, [trueviewBidStrategyTypeIndex]);
}

/**
 * Update the ad group sheet with the config data.
 */
function adGroupSheetUpdate() {
  var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ADGROUP_SHEET_NAME);
  var sdfCampaignConfig = getSdfCampaignConfig();
  var cpv = sdfCampaignConfig[CPV];
  var cpm = sdfCampaignConfig[CPM];
  var cpa = sdfCampaignConfig[CPA];
  var creation = sdfCampaignConfig[CREATION]

  startRow = 2;
  startColumn = 1;
  lastRow = sheet.getLastRow();
  lastColumn = sheet.getLastColumn();

  range = sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn);

  var currentValues =
      sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn)
          .getValues();

  var lineitemBidStrategyType = getLineitemBidStrategyType();
  console.log(lineitemBidStrategyType);

  for (i = 0; i < currentValues.length; i++) {
    row = currentValues[i];

    // ad group id
    if (creation) row[0] = 'ext' + row[0];
    // line item id
    if (creation) row[1] = 'ext' + row[1];
    lineitemId = row[1];
    console.log(lineitemId);
    // Bid Cost
    var bidType =
        lineitemBidStrategyType[lineitemId]['TrueView Bid Strategy Type'];
    if (bidType === 'Maximum Conversions') {
      row[5] = 0;
    } else if (bidType === 'Target CPM' && cpm) {
      row[5] = cpm;
    } else if ((bidType === 'Target CPV' || bidType === 'Manual CPV') && cpv) {
      row[5] = cpv;
    } else if (bidType === 'Target CPA' && cpa) {
      row[5] = cpa;
    }
    // if modifying, delete row 11 to 21 (column 12 to 22) for placement
    // targetings
    if (!creation) row[11] = '';
    if (!creation) row[12] = '';
    if (!creation) row[13] = '';
    if (!creation) row[14] = '';
    if (!creation) row[15] = '';
    if (!creation) row[16] = '';
    if (!creation) row[17] = '';
    if (!creation) row[18] = '';
    if (!creation) row[19] = '';
    if (!creation) row[20] = '';
    if (!creation) row[21] = '';
    sheet.getRange(startRow + i, startColumn, 1, lastColumn).setValues([row]);
  }
}

/**
 * Update the ads sheet with the config data.
 */
function adSheetUpdate() {
  var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AD_SHEET_NAME);
  var sdfCampaignConfig = getSdfCampaignConfig();
  var creation = sdfCampaignConfig[CREATION]

  startRow = 2;
  startColumn = 1;
  lastRow = sheet.getLastRow();
  lastColumn = sheet.getLastColumn();

  range = sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn);

  var currentValues =
      sheet.getRange(startRow, startColumn, lastRow - 1, lastColumn)
          .getValues();

  for (i = 0; i < currentValues.length; i++) {
    row = currentValues[i];

    // ad id
    if (creation) row[0] = '';
    // ad group id
    if (creation) row[1] = 'ext' + row[1];
    sheet.getRange(startRow + i, startColumn, 1, lastColumn).setValues([row]);
  }
}

// helper functions
// fix date formats for csv conversion
// TODO: How is this different from formatDateIo in util.js? Maybe can remove
// one of them?
function formatDate(date) {
  var d = new Date(date), month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(), year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [month, day, year].join('/') + ' 00:00';
}
