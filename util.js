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
 * Helper function to show a message for confirmation.
 * @param {string} msg The message to prompt.
 * @return {boolean} Return true if user clicked yes.
 */
function shouldContinue(msg) {
  var ui = SpreadsheetApp.getUi();
  var promptVal = ui.alert(msg, ui.ButtonSet.YES_NO);
  return promptVal === ui.Button.YES;
}

/**
 * Helper function used in the html file to fetch css and js files.
 * @param {string} filename The name of the template file.
 * @return {string} The content of the template after evaluating it.
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

/**
 * Helper function to see if a sheet with a name exists.
 * @param {string} sheetName The name of the sheet.
 * @return {boolean} True if the sheet exists.
 */
function checkSheetExists(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  var isConfigSheetPresent = false;
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() === sheetName) {
      isConfigSheetPresent = true;
      break;
    }
  }
  return isConfigSheetPresent;
}

/**
 * Show a toast message.
 * @param {string} msg The message to show in a toast.
 */
function showToast(msg) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.toast(msg);
}

/**
 * Change the date in the given range to be the required format for SDF.
 * @param {Range} range The range to update format.
 */
function fixDateFormat(range) {
  range.setNumberFormat('MM/DD/YYYY HH:mm');
}

/**
 * Makes an api call to the specified url.
 * @param {string} url The url of the request.
 * @param {string} methodType The type of http request (GET/POST).
 * @param {!Object} requestBody The body of the request in json form.
 * @param {boolean} noParse Don't parse the response as JSON.
 */
function callApi(url, methodType, requestBody, noParse) {
  var headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
  };
  var options = {
    method: methodType,
    headers: headers,
    muteHttpExceptions: true
  };
  if (requestBody) {
    options.payload = JSON.stringify(requestBody);
  }
  try {
    if (noParse) {
      return UrlFetchApp.fetch(url, options).getBlob();
    } else {
      return JSON.parse(UrlFetchApp.fetch(url, options));
    }
  } catch (e) {
    Logger.log('Error in accessing the API');
    throw e;
  }
}

/**
 * Convert the date into a string formatted as MM/DD/YYYY HH:mm.
 * https://stackoverflow.com/questions/23593052/format-javascript-date-to-yyyy-mm-dd
 * @param {Date} date The date to format.
 * @return {string} The formatted date as a string.
 */
function formatDateIo(date) {
  var d = new Date(date), month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(), year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [month, day, year].join('/');
}

/**
 * Get the daily budget amount for the lineitem sheet using budget set in
 * config.
 * @param {Date} startDate The start date.
 * @param {Date} endDate The end date.
 * @param {number} count The number of lineitems.
 * @param {number} ioBudget The budget for the insertion order.
 * @return {number} The daily budget for each line item.
 */
function dailyBudget(startDate, endDate, count, ioBudget) {
  var t1 = startDate.valueOf();
  var t2 = endDate.valueOf() + 3600000;
  var diffInDays = Math.floor((t2 - t1) / (24 * 3600 * 1000));
  var dailyBudget = Math.floor(ioBudget / (diffInDays * (count - 1)));
  return dailyBudget;
}

/**
 * Convert the insertion order budget from a number to SDF string.
 * @param {number} value The insertion order budget amount.
 * @param {Date} startDate The start date.
 * @param {Date} endDate The end date.
 * @return {string} The budget for the insertion order in the right format for
 * SDF.
 */
function ioBudgetFormat(value, startDate, endDate) {
  var ioStartDate = formatDateIo(startDate);
  var ioEndDate = formatDateIo(endDate);
  var ioBudgetSegment =
      '(' + value + ';' + ioStartDate + ';' + ioEndDate + ';)';
  return ioBudgetSegment;
}

/**
 * Fetches the data from the relevant sheet.
 * Uses an index specified for the column to use as index
 * and returns the values in an indexed object.
 * @param {string} sheetName The name of sheet.
 * @param {number} idColumnIndex The index number of the column which is the
 *     unique identifier.
 * @param {Array<number>} columnIndices The indices of columns to fetch for the
 *     given id column index.
 * @return {!Object}
 */
function getData(sheetName, idColumnIndex, columnIndices) {
  var curSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var lastRow = curSheet.getLastRow();
  var lastCol = curSheet.getLastColumn();

  var sheetHeadingData = curSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var sheetData = curSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return getIndexedDataFromArray(
      sheetData, sheetHeadingData, idColumnIndex, columnIndices);
}

function getIndexedDataFromArray(
    arrData, headingData, idColumnIndex, columnIndices) {
  var finalData = {};
  arrData.forEach(function(curRow) {
    var curId = curRow[idColumnIndex];
    finalData[curId] = {};
    columnIndices.forEach(function(idx) {
      var eleName = headingData[idx];
      var eleValue = curRow[idx];

      finalData[curId][eleName] = eleValue;
    });
  });
  return finalData;
}

/**
 * Show an alert message.
 * @param {string} msg The message to show in the alert.
 */
function showAlert(msg) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(msg);
}

/**
 * Show an alert message.
 * @param {string} msg The message to show in the alert.
 */
function showAlertWithTitle(title, msg) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(title, msg, ui.ButtonSet.OK);
}
