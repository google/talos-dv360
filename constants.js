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

// Set to false before deploying.
var IS_DEBUG = true;
// For DV360 API json request - specify filetypes to retrieve and filter on
// object type campaign id
var FILE_TYPES = [
  'FILE_TYPE_CAMPAIGN', 'FILE_TYPE_INSERTION_ORDER', 'FILE_TYPE_LINE_ITEM',
  'FILE_TYPE_AD_GROUP', 'FILE_TYPE_AD'
];

var CAMPAIGN_FILTER_TYPE = 'FILTER_TYPE_CAMPAIGN_ID';
var IO_FILTER_TYPE = 'FILTER_TYPE_INSERTION_ORDER_ID';
var TRUEVIEW_TYPE = 'TrueView';

var CAMPAIGN_SHEET_NAME = 'SDF-Campaigns.csv';
var IO_SHEET_NAME = 'SDF-InsertionOrders.csv';
var LI_SHEET_NAME = 'SDF-LineItems.csv';
var ADGROUP_SHEET_NAME = 'SDF-AdGroups.csv';
var AD_SHEET_NAME = 'SDF-AdGroupAds.csv';

var SHEETS_ORDER = [
  CAMPAIGN_SHEET_NAME, IO_SHEET_NAME, LI_SHEET_NAME, ADGROUP_SHEET_NAME,
  AD_SHEET_NAME
];

var CONFIG_SHEET_NAME = 'Configuration';
var TRACKER_SHEET_NAME = 'Tracker';

// Master sheet to copy the config sheets from.
var MASTER_CONFIG_SHEET = '1QiNwdN6QPVEG6xtoPnrPwdynC8NtGmPsBAAQAzCsfEs';
// Config sheet name in master config sheet will also be 'Configuration'.

var INSERTION_ORDER_ID = 'Insertion Order ID';
var CAMPAIGN_ID = 'Campaign ID';
var SOURCE_PARTNER_ID = 'sourcePartnerId';
var SOURCE_CAMPAIGN_ID = 'sourceCampaignId';
var SOURCE_IO_ID = 'sourceIoId';
var DESTINATION_CAMPAIGN_ID = 'destinationCampaignId';

// Fields for SDF Camapaign Config.
var CAMPAIGN_NAME = 'Campaign Name';
var IO_NAME = 'Insertion Order Name';
var START_DATE = 'Start Date';
var END_DATE = 'End Date';
var IO_BUDGET = 'IO Budget';
var GEO_ID = 'Geography ID';
var CPV = 'CPV';
var CPM = 'CPM';
var CPA = 'CPA';
var CREATION = 'Creation';

var SDF_VERSION = 'SDF_VERSION_5_3';
var DV360_API_VERSION = 'v1';

// 3PAS tracker constants.
var MASTER_CONFIG_SHEET_3PAS = '1zKIRF54bYXWTHe6D4Kq2N-yJEu5vvn7OaI7p7aO-Y_A';
var CONFIG_SHEET_NAME_3PAS = 'Form';

// Too Big sheet - where the values are split and saved temporarily if they are
// more than 50K characters which is the size limit of a single cell.
var TOO_BIG_SHEET = 'TooBig';
