// Google Apps Script for KMS AI Tips Submission Form
// Deploy this as a web app in your Google Sheet

// Firebase Configuration
const FIREBASE_PROJECT_ID = 'kms-ai-leaderboard';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE_TABLE_PLAYBOOKS = 'playbooks';
const FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD = 'individual-leaderboard';
const FIRESTORE_COLLECTION_TEAM_LEADERBOARD = 'team-leaderboard';
const LEADERBOARD_SHEET_NAME = 'Leaderboard by Individual'; // Change this to match your sheet name
const TEAM_LEADERBOARD_SHEET_NAME = 'Leaderboard by Account/Department'; // Change this to match your team sheet name
const FIRESTORE_TABLE_REACTIONS = 'reactions';

function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Log the raw request for debugging
    console.log('Raw postData:', e.postData);
    console.log('Parameter data:', e.parameter);
    console.log('Content type:', e.postData ? e.postData.type : 'No postData');

    // Parse the form data - handle both JSON and form data
    let data;

    // Check if we have parameter data (form submission)
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      console.log('Using parameter data (form submission)');
      data = e.parameter;
    }
    // Check if we have JSON data
    else if (e.postData && e.postData.contents) {
      console.log('Attempting to parse JSON data');
      try {
        data = JSON.parse(e.postData.contents);
        console.log('Successfully parsed JSON');
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        console.log('Raw contents:', e.postData.contents);

        // Try to parse as URL-encoded data
        const urlParams = new URLSearchParams(e.postData.contents);
        data = {};
        for (const [key, value] of urlParams) {
          data[key] = value;
        }
        console.log('Parsed as URL-encoded data:', data);
      }
    }
    else {
      throw new Error('No data received in request');
    }

    // Log received data for debugging
    console.log('Final parsed data:', data);

    // Validate required fields
    if (!data.fullName || !data.email || !data.department || !data.submissionType || !data.title || !data.description) {
      console.error('Missing required fields:', {
        fullName: !!data.fullName,
        email: !!data.email,
        department: !!data.department,
        submissionType: !!data.submissionType,
        title: !!data.title,
        description: !!data.description
      });

      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Please fill in all required fields.'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error('Invalid email format:', data.email);

      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Please enter a valid email address.'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get the next row number
    const lastRow = sheet.getLastRow();
    const nextRow = lastRow + 1;

    console.log('Inserting data into row:', nextRow);

    // Prepare the data to insert (matching your sheet columns)
    const timestamp = new Date();
    const rowData = [
      nextRow - 1, // NO (auto-increment)
      data.fullName,
      data.email,
      data.department,
      data.submissionType,
      data.title,
      data.description,
      data.tags || '',
      data.attachments || '' // Will be handled separately for file uploads
    ];

    console.log('Row data to insert:', rowData);

    // Insert the data into the sheet
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    console.log('Data inserted successfully');

    // Format the new row
    const range = sheet.getRange(nextRow, 1, 1, rowData.length);
    range.setBorder(true, true, true, true, true, true);

    // Auto-resize columns if needed
    sheet.autoResizeColumns(1, rowData.length);

    // Send success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Thank you! Your AI tip has been submitted successfully and will be reviewed soon.',
        submissionId: nextRow - 1
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error
    console.error('Form submission error:', error);
    console.error('Error stack:', error.stack);

    // Send error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Sorry, there was an error submitting your form. Please try again later.',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (for testing) and form submissions via GET (for iframe method)
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    // If parameters are present, treat as form submission
    return doPost(e);
  } else {
    // Otherwise, return API status
    return ContentService
      .createTextOutput(JSON.stringify({
        message: 'KMS AI Tips Submission API is running!',
        timestamp: new Date(),
        cors: 'enabled'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to get individual leaderboard data from the specific sheet
function getIndividualLeaderboardData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Try to get the specific leaderboard sheet
    let sheet;
    try {
      // Look for the "Leaderboard by Individual" sheet or similar
      sheet = spreadsheet.getSheetByName('Leaderboard by Individual') ||
        spreadsheet.getSheetByName('AI for Everyone') ||
        spreadsheet.getSheetByName('Leaderboard') ||
        spreadsheet.getActiveSheet();
    } catch (e) {
      sheet = spreadsheet.getActiveSheet();
    }

    console.log('Using sheet for individual:', sheet.getName());

    // Get data from specific range (A1:G) to match your structure
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No data rows found (only header or empty sheet)');
      return {
        success: true,
        individual: [],
        message: 'No leaderboard entries yet',
        lastUpdated: new Date().toISOString(),
        totalEntries: 0
      };
    }

    const range = sheet.getRange(1, 1, lastRow, 7); // Columns A-G
    const data = range.getValues();

    console.log('Raw data from sheet (first 5 rows):', data.slice(0, 5));

    // Skip header row and process data
    const rows = data.slice(1).filter(row => {
      // Filter out empty rows - must have No, Full Name, Function, and Points
      return row[0] && row[2] && row[3] && (row[6] || row[6] === 0);
    });

    console.log('Filtered rows count:', rows.length);
    console.log('Sample filtered row:', rows[0]);

    // Map the data according to your sheet structure
    const leaderboardData = rows.map((row, index) => {
      const points = parseInt(row[6]) || 0;
      return {
        rank: index + 1,
        no: row[0] ? row[0].toString() : '',
        id: row[1] ? row[1].toString() : '',
        fullName: row[2] ? row[2].toString() : 'Unknown',
        function: row[3] ? row[3].toString() : 'Unknown',
        subDepartment: row[4] ? row[4].toString() : '',
        account: row[5] ? row[5].toString() : row[2] ? row[2].toString() : 'N/A',
        points: points,
        pointsPerTeamSize: points // You can modify this calculation as needed
      };
    }).sort((a, b) => b.points - a.points); // Sort by points descending

    console.log('Processed individual leaderboard data:', leaderboardData.slice(0, 3));

    return {
      success: true,
      individual: leaderboardData,
      lastUpdated: new Date().toISOString(),
      totalEntries: leaderboardData.length,
      sheetName: sheet.getName()
    };

  } catch (error) {
    console.error('Error getting individual leaderboard data:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to load individual leaderboard data: ' + error.message
    };
  }
}

// Function to get team leaderboard data from "Leaderboard by Account/Department" sheet
function getTeamLeaderboardData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Get the "Leaderboard by Account/Department" sheet
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName('Leaderboard by Account/Department');
      if (!sheet) {
        sheet = spreadsheet.getSheetByName('Leaderboard by Account') ||
          spreadsheet.getSheetByName('Team Leaderboard') ||
          spreadsheet.getActiveSheet();
      }
    } catch (e) {
      sheet = spreadsheet.getActiveSheet();
    }

    console.log('Using sheet for teams:', sheet.getName());

    // Get data from specific range - columns A through G based on your sheet structure
    // Columns: No, Function, Sub-department, Account, Accumulated Points, Team size, Accumulated based on FTE only
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No team data rows found (only header or empty sheet)');
      return {
        success: true,
        team: [],
        message: 'No team leaderboard entries yet',
        lastUpdated: new Date().toISOString(),
        totalEntries: 0
      };
    }

    const range = sheet.getRange(1, 1, lastRow, 7); // Columns A-G
    const data = range.getValues();

    console.log('Raw team data from sheet (first 5 rows):', data.slice(0, 5));

    // Skip header row and process data
    const rows = data.slice(1).filter(row => {
      // Filter out empty rows - must have No, Function, Account, and Points
      return row[0] && row[1] && row[3] && (row[4] || row[4] === 0) && row[5];
    });

    console.log('Filtered team rows count:', rows.length);
    console.log('Sample filtered team row:', rows[0]);

    // Map the data according to team sheet structure
    const teamLeaderboardData = rows.map((row, index) => {
      const points = parseInt(row[4]) || 0; // Accumulated Points
      const teamSize = parseInt(row[5]) || 1; // Team size

      return {
        rank: index + 1,
        no: row[0] ? row[0].toString() : '',
        function: row[1] ? row[1].toString() : 'Unknown',
        subDepartment: row[2] ? row[2].toString() : '',
        program: row[2] ? row[2].toString() : '', // Sub-department (Program)
        account: row[3] ? row[3].toString() : 'Unknown',
        accumulatedPoints: points,
        teamSize: teamSize,
        pointsPerTeamMember: teamSize > 0 ? (points / teamSize).toFixed(2) : points,
        accumulatedBasedOnFTE: row[6] ? row[6].toString() : ''
      };
    }).sort((a, b) => b.pointsPerTeamMember - a.pointsPerTeamMember);

    console.log('Processed team leaderboard data:', teamLeaderboardData.slice(0, 3));

    return {
      success: true,
      team: teamLeaderboardData,
      lastUpdated: new Date().toISOString(),
      totalEntries: teamLeaderboardData.length,
      sheetName: sheet.getName()
    };

  } catch (error) {
    console.error('Error getting team leaderboard data:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to load team leaderboard data: ' + error.message
    };
  }
}

// Function to get both individual and team leaderboard data
function getLeaderboardData() {
  try {
    const individualResult = getIndividualLeaderboardData();
    const teamResult = getTeamLeaderboardData();

    return {
      success: individualResult.success && teamResult.success,
      individual: individualResult.individual || [],
      team: teamResult.team || [],
      lastUpdated: new Date().toISOString(),
      messages: {
        individual: individualResult.message,
        team: teamResult.message
      },
      totalEntries: {
        individual: individualResult.totalEntries || 0,
        team: teamResult.totalEntries || 0
      },
      sheetNames: {
        individual: individualResult.sheetName,
        team: teamResult.sheetName
      }
    };

  } catch (error) {
    console.error('Error getting combined leaderboard data:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to load leaderboard data: ' + error.message
    };
  }
}

// Handle GET requests for leaderboard data
function doGet(e) {
  // Handle GET requests (for testing) and leaderboard data requests
  if (e.parameter && e.parameter.action === 'getLeaderboard') {
    console.log('Leaderboard data requested');
    const leaderboardData = getLeaderboardData();

    // Check if JSONP callback is requested
    if (e.parameter.callback) {
      console.log('JSONP callback requested:', e.parameter.callback);
      const jsonpResponse = e.parameter.callback + '(' + JSON.stringify(leaderboardData) + ');';

      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // Regular JSON response
      return ContentService
        .createTextOutput(JSON.stringify(leaderboardData))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Handle playbooks data requests
  if (e.parameter && e.parameter.action === 'getPlaybooks') {
    console.log('Playbooks data requested');
    const playbooksData = getPlaybooksFromFirebase();

    // Check if JSONP callback is requested
    if (e.parameter.callback) {
      console.log('JSONP callback requested:', e.parameter.callback);
      const jsonpResponse = e.parameter.callback + '(' + JSON.stringify(playbooksData) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // Regular JSON response
      return ContentService
        .createTextOutput(JSON.stringify(playbooksData))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Handle form submissions via GET (for iframe method)
  if (e.parameter && Object.keys(e.parameter).length > 1) {
    return doPost(e);
  }

  // Default API status response
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'KMS AI Tips API is running!',
      timestamp: new Date(),
      endpoints: {
        submit: 'POST /',
        leaderboard: 'GET /?action=getLeaderboard',
        leaderboardJsonp: 'GET /?action=getLeaderboard&callback=yourCallback',
        playbooks: 'GET /?action=getPlaybooks',
        playbooksJsonp: 'GET /?action=getPlaybooks&callback=yourCallback'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to test the script
function testSubmission() {
  const testData = {
    fullName: 'Test User',
    email: 'test@kms-technology.com',
    department: 'Engineering',
    submissionType: 'ai-tip',
    title: 'Test AI Tip',
    description: 'This is a test submission to verify the Google Apps Script integration.',
    tags: 'test, ai, automation'
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockEvent);
  console.log('Test result:', result.getContent());
}

// --- FIREBASE INTERACTION SECTION ---
function findDocumentNameByKey(sheetKey) {
  try {
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      "structuredQuery": {
        "from": [{ "collectionId": FIRESTORE_TABLE_PLAYBOOKS }],
        "where": {
          "fieldFilter": {
            "field": { "fieldPath": "sheetKey" },
            "op": "EQUAL",
            "value": { "stringValue": sheetKey }
          }
        },
        "limit": 1
      }
    };
    const queryOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(queryPayload)
    };
    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const queryResult = JSON.parse(queryResponse.getContentText());

    if (queryResult && queryResult[0] && queryResult[0].document) {
      return queryResult[0].document.name;
    }
    return null;
  } catch (error) {
    Logger.log('ERROR in findDocumentNameByKey: ' + error.toString());
    return null;
  }
}

function getPlaybooksFromFirebase() {
  try {
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;

    const queryPayload = {
      "structuredQuery": {
        "from": [{ "collectionId": FIRESTORE_TABLE_PLAYBOOKS }],
        "where": {
          "fieldFilter": {
            "field": { "fieldPath": "isApproved" },
            "op": "EQUAL",
            "value": { "booleanValue": true }
          }
        }
      }
    };

    const queryOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const responseCode = queryResponse.getResponseCode();
    const responseBody = queryResponse.getContentText();

    if (responseCode !== 200) {
      Logger.log('ERROR: ' + responseBody);
      return { success: false, error: responseBody, playbooks: [] };
    }

    const queryResult = JSON.parse(responseBody);
    const playbooks = [];

    if (queryResult && queryResult.length > 0) {
      queryResult.forEach(result => {
        if (result.document && result.document.fields) {
          const fields = result.document.fields;
          const category = fields.category ? fields.category.stringValue : '';

          // Map category to our internal categories
          let mappedCategory = 'Productivity'; // default
          if (category) {
            const cat = category.toLowerCase();
            if (cat.includes('driving operational efficiency') || cat.includes('productivity')) {
              mappedCategory = 'Productivity';
            } else if (cat.includes('predictive insights') || cat.includes('data') || cat.includes('analysis')) {
              mappedCategory = 'Data & Analysis';
            } else if (cat.includes('customer experience')) {
              mappedCategory = 'Customer Experience';
            } else if (cat.includes('innovation') || cat.includes('creativity')) {
              mappedCategory = 'Innovation';
            }
          }

          playbooks.push({
            timestamp: fields.timestamp ? fields.timestamp.timestampValue : '',
            owner: fields.email ? fields.email.stringValue : '',
            category: mappedCategory,
            description: fields.description ? fields.description.stringValue : '',
            sheetKey: fields.sheetKey ? fields.sheetKey.stringValue : ''
          });
        }
      });
    }

    Logger.log(`Found ${playbooks.length} approved playbooks from Firebase.`);

    return { success: true, playbooks: playbooks, count: playbooks.length };

  } catch (error) {
    Logger.log('ERROR getting playbooks from Firebase: ' + error.toString());
    return { success: false, error: error.toString(), playbooks: [] };
  }
}

function savePlaybookToFirebase(submissionData) {
  try {
    const url = `${FIRESTORE_BASE_URL}/${FIRESTORE_TABLE_PLAYBOOKS}`;
    const key = createPlaybookKey(submissionData.email, submissionData.timestamp);

    const firestoreData = {
      fields: {
        category: { stringValue: submissionData.category || '' },
        description: { stringValue: submissionData.description || '' },
        email: { stringValue: submissionData.email || '' },
        isApproved: { booleanValue: false },
        timestamp: { timestampValue: submissionData.timestamp || new Date().toISOString() },
        sheetKey: { stringValue: key },
        supportingMaterials: { stringValue: submissionData.supportingMaterials || '' }
      }
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(firestoreData)
    };

    const response = UrlFetchApp.fetch(url, options);

    if (response.getResponseCode() === 200) {
      Logger.log('Successfully saved to Firestore with sheetKey: ' + key);
      return { success: true };
    } else {
      Logger.log('Error saving to Firestore: ' + response.getContentText());
      return { success: false, error: response.getContentText() };
    }
  } catch (error) {
    Logger.log('Exception saving to Firestore: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function updatePlaybookApproveStatus(sheetKey, isApproved) {
  try {
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      "structuredQuery": {
        "from": [{ "collectionId": FIRESTORE_TABLE_PLAYBOOKS }],
        "where": {
          "fieldFilter": {
            "field": { "fieldPath": "sheetKey" },
            "op": "EQUAL",
            "value": { "stringValue": sheetKey }
          }
        },
        "limit": 1
      }
    };

    const queryOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(queryPayload)
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const queryResult = JSON.parse(queryResponse.getContentText());

    if (!queryResult || !queryResult[0] || !queryResult[0].document) {
      Logger.log('ERROR: Could not find document in Firebase with key: ' + sheetKey);
      return;
    }

    const documentName = queryResult[0].document.name;
    const updateUrl = `https://firestore.googleapis.com/v1/${documentName}?updateMask.fieldPaths=isApproved`;

    const updatePayload = {
      fields: {
        isApproved: { booleanValue: isApproved }
      }
    };

    const updateOptions = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(updatePayload)
    };

    const updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);

    if (updateResponse.getResponseCode() === 200) {
      Logger.log('Successfully updated isApproved to ' + isApproved + ' for document: ' + documentName);
    } else {
      Logger.log('Error updating document: ' + updateResponse.getContentText());
    }

  } catch (error) {
    Logger.log('Exception in updatePlaybookApproveStatus: ' + error.toString());
  }
}

function updatePlayBookByKey(documentName, data) {
  try {
    const updateMask = 'updateMask.fieldPaths=category&updateMask.fieldPaths=description&updateMask.fieldPaths=email&updateMask.fieldPaths=isApproved&updateMask.fieldPaths=timestamp&updateMask.fieldPaths=sheetKey&updateMask.fieldPaths=supportingMaterials';
    const updateUrl = `https://firestore.googleapis.com/v1/${documentName}?${updateMask}`;

    const firestoreData = {
      fields: {
        category: { stringValue: data.category || '' },
        description: { stringValue: data.description || '' },
        email: { stringValue: data.email || '' },
        isApproved: { booleanValue: data.isApproved || false },
        timestamp: { timestampValue: data.timestamp || new Date().toISOString() },
        sheetKey: { stringValue: data.sheetKey },
        supportingMaterials: { stringValue: data.supportingMaterials || '' }
      }
    };

    const updateOptions = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(firestoreData) // <--- SỬA LẠI THÀNH 'firestoreData'
    };

    const updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
    if (updateResponse.getResponseCode() === 200) {
      Logger.log('Successfully UPDATED document: ' + documentName);
    } else {
      Logger.log('Error UPDATING document: ' + updateResponse.getContentText());
    }
  } catch (error) {
    Logger.log('Exception in updatePlayBookByKey: ' + error.toString());
  }
}

function countReactionsForPlaybook(playbookId) {
  const url = `${FIRESTORE_BASE_URL}:runAggregationQuery`;

  const queryPayload = {
    "structuredAggregationQuery": {
      "structuredQuery": {
        "from": [{ "collectionId": FIRESTORE_TABLE_REACTIONS }],
        "where": {
          "fieldFilter": {
            "field": { "fieldPath": "playbook_id" },
            "op": "EQUAL",
            "value": { "stringValue": playbookId }
          }
        }
      },
      "aggregations": [
        {
          "count": {},
          "alias": "total_count"
        }
      ]
    }
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(queryPayload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseBody = response.getContentText();
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log(`Error counting reactions for ${playbookId}. Code: ${responseCode}, Body: ${responseBody}`);
      return 0;
    }

    const result = JSON.parse(responseBody);

    if (result && result[0] && result[0].result && result[0].result.aggregateFields) {
      const count = result[0].result.aggregateFields.total_count.integerValue;
      return parseInt(count) || 0;
    } else {
      return 0;
    }

  } catch (error) {
    Logger.log(`Exception while counting reactions for ${playbookId}: ${error.toString()}`);
    return 0;
  }
}

// --- SHEET LOGIC SECTION ---
function createPlaybookKey(email, timestamp) {
  const data = String(email) + String(timestamp);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

// --- PLAYBOOK LOGIC (SHEET TRIGGERS) ---
function onFormSubmit(e) {
  try {
    const rawData = e.namedValues;
    const sheet = e.range.getSheet();
    const row = e.range.getRow();

    const formTimestampObject = sheet.getRange(row, 1).getValue();
    const standardTimestamp = new Date(formTimestampObject).toISOString();

    const submissionData = {
      timestamp: standardTimestamp,
      email: rawData['Email Address'] ? rawData['Email Address'][0] : '',
      category: rawData['Your Tip Category:'] ? rawData['Your Tip Category:'][0] : '',
      description: rawData['Description of Your Tip:'] ? rawData['Description of Your Tip:'][0] : '',
      supportingMaterials: rawData['Supporting Materials:'] ? rawData['Supporting Materials:'][0] : 'N/A',
      savedToFirebaseAt: new Date().toISOString()
    };

    Logger.log('Processing submission: ' + JSON.stringify(submissionData, null, 2));

    const firebaseResult = savePlaybookToFirebase(submissionData);

    if (firebaseResult.success) {
      Logger.log('Successfully processed onFormSubmit');
    } else {
      Logger.log('ERROR in onFormSubmit (saving to Firestore): ' + firebaseResult.error);
    }

  } catch (error) {
    Logger.log('ERROR in onFormSubmit: ' + error.toString());
  }
}

function checkApprovalStatus(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();

    if (range.getColumn() < 6 || range.getColumn() > 10) {
      return;
    }

    const editedRow = range.getRow();
    const approvalValues = sheet.getRange(editedRow, 6, 1, 5).getValues()[0];
    const approvedCount = approvalValues.filter(cell => String(cell).includes("Approved")).length;

    const lastColumn = sheet.getLastColumn();
    const fullRecord = sheet.getRange(editedRow, 1, 1, lastColumn).getValues()[0];
    const sheetTimestampObject = fullRecord[0];
    const email = fullRecord[1];

    if (!sheetTimestampObject || !email) {
      Logger.log('ERROR: Timestamp (Col A) or Email (Col B) is missing from row. Cannot update Firebase.');
      return;
    }

    const standardTimestamp = new Date(sheetTimestampObject).toISOString();
    const keyToUpdate = createPlaybookKey(email, standardTimestamp);

    if (approvedCount >= 3) {
      Logger.log(`✅ Post at row ${editedRow} is approved with ${approvedCount} votes.`);
      Logger.log('Generated key for update: ' + keyToUpdate);
      updatePlaybookApproveStatus(keyToUpdate, true);
    } else {
      Logger.log(`⏳ Post at row ${editedRow} is not yet approved. Approval count: ${approvedCount}`);
      updatePlaybookApproveStatus(keyToUpdate, false);
    }
  } catch (error) {
    Logger.log('ERROR during checkApprovalStatus: ' + error.toString());
  }
}

function syncDataSheetToFirebase() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  Logger.log(`Starting sync for ${data.length} rows...`);

  data.forEach((row, index) => {
    const rowNumber = index + 2;
    const sheetTimestampObject = row[0];
    const email = row[1];

    if (!sheetTimestampObject || !email) {
      Logger.log(`Skipping row ${rowNumber}: Missing Timestamp or Email.`);
      return;
    }

    const standardTimestamp = new Date(sheetTimestampObject).toISOString();
    const sheetKey = createPlaybookKey(email, standardTimestamp);

    const payload = {
      timestamp: standardTimestamp,
      email: email,
      category: row[2] || '',
      description: row[3] || '',
      supportingMaterials: row[4] || '',
      isApproved: (row[10] === "Approved"),
      sheetKey: sheetKey
    };

    const documentName = findDocumentNameByKey(sheetKey);

    if (documentName) {
      Logger.log(`Row ${rowNumber}: Found. Updating doc for key ${sheetKey}`);
      updatePlayBookByKey(documentName, payload);
    } else {
      Logger.log(`Row ${rowNumber}: Not found. Creating new doc for key ${sheetKey}`);
      savePlaybookToFirebase(payload);
    }
  });

  Logger.log('Sync completed.');
}

// =============================================================================
// INDIVIDUAL LEADERBOARD SYNC TO FIREBASE
// =============================================================================

/**
 * Sync a single leaderboard entry to Firebase
 * @param {Object} entry - The leaderboard entry data
 * @returns {Object} - Result object with success status
 */
function syncLeaderboardEntryToFirebase(entry) {
  try {
    if (!entry || !entry.account) {
      Logger.log('Invalid entry: missing account');
      return { success: false, error: 'Missing account' };
    }

    // Create UNIQUE document ID using multiple fields to avoid overwrites
    // Format: {no}_{sanitized_email}_{sanitized_subdept}
    // This ensures each row gets its own document even if same person appears multiple times
    const sanitizedEmail = entry.account.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedSubDept = (entry.subDepartment || 'none').replace(/[^a-zA-Z0-9_-]/g, '_');
    const documentId = `${entry.no}_${sanitizedEmail}_${sanitizedSubDept}`;

    Logger.log(`Creating/updating document with ID: ${documentId}`);

    const url = `${FIRESTORE_BASE_URL}/${FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD}/${documentId}`;

    // Prepare Firestore document structure
    const firestoreData = {
      fields: {
        no: { integerValue: entry.no.toString() },
        id: { stringValue: entry.id.toString() },
        fullName: { stringValue: entry.fullName },
        function: { stringValue: entry.function },
        subDepartment: { stringValue: entry.subDepartment || '' },
        account: { stringValue: entry.account },
        points: { integerValue: entry.points.toString() },
        rank: { integerValue: entry.rank.toString() },
        uniqueId: { stringValue: documentId }, // Store the unique ID in the document
        lastUpdated: { timestampValue: new Date().toISOString() }
      }
    };

    const options = {
      method: 'patch',
      contentType: 'application/json',
      payload: JSON.stringify(firestoreData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log(`Successfully synced entry: ${documentId} (${entry.fullName} - ${entry.subDepartment})`);
      return { success: true, documentId: documentId };
    } else {
      Logger.log(`Error syncing entry: ${response.getContentText()}`);
      return { success: false, error: response.getContentText() };
    }

  } catch (error) {
    Logger.log(`Exception syncing entry to Firebase: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Sync all individual leaderboard data from sheet to Firebase
 * This function reads the entire leaderboard sheet and syncs to Firebase
 */
function syncAllLeaderboardToFirebase() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Get the leaderboard sheet
    const sheet = spreadsheet.getSheetByName(LEADERBOARD_SHEET_NAME) ||
      spreadsheet.getSheetByName('AI for Everyone') ||
      spreadsheet.getSheetByName('Leaderboard') ||
      spreadsheet.getActiveSheet();

    Logger.log(`Syncing from sheet: ${sheet.getName()}`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data to sync (only header or empty sheet)');
      return { success: true, message: 'No data to sync', synced: 0 };
    }

    // Get all data (columns A-G: No, ID, Full Name, Function, Sub-department, Account, Points)
    const range = sheet.getRange(2, 1, lastRow - 1, 7); // Skip header row
    const data = range.getValues();

    Logger.log(`Found ${data.length} rows to process`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    data.forEach((row, index) => {
      // Skip empty rows
      if (!row[0] || !row[2] || !row[5]) {
        Logger.log(`Skipping row ${index + 2}: missing required data`);
        return;
      }

      const entry = {
        no: row[0],
        id: row[1] || '',
        fullName: row[2],
        function: row[3] || 'Unknown',
        subDepartment: row[4] || '',
        account: row[5],
        points: parseInt(row[6]) || 0,
        rank: index + 1 // Will be recalculated based on points
      };

      const result = syncLeaderboardEntryToFirebase(entry);

      if (result.success) {
        syncedCount++;
      } else {
        errorCount++;
        errors.push({ row: index + 2, account: entry.account, error: result.error });
      }

      // Add a small delay to avoid rate limiting
      if ((index + 1) % 10 === 0) {
        Utilities.sleep(500); // Sleep for 500ms every 10 requests
      }
    });

    Logger.log(`Sync completed: ${syncedCount} succeeded, ${errorCount} failed`);

    if (errors.length > 0) {
      Logger.log('Errors:', JSON.stringify(errors));
    }

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      errorDetails: errors
    };

  } catch (error) {
    Logger.log(`Exception in syncAllLeaderboardToFirebase: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Watch for changes in the leaderboard sheet and sync to Firebase
 * This function is triggered automatically when the sheet is edited
 */
function onEditLeaderboardSync(e) {
  try {
    // Check if the edit happened in the leaderboard sheet
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();

    if (sheetName !== LEADERBOARD_SHEET_NAME &&
      sheetName !== 'AI for Everyone' &&
      sheetName !== 'Leaderboard') {
      return; // Not the leaderboard sheet, ignore
    }

    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();

    // Only process if editing data rows (not header) and relevant columns (A-G)
    if (editedRow <= 1 || editedCol > 7) {
      return;
    }

    Logger.log(`Detected edit in ${sheetName} at row ${editedRow}, column ${editedCol}`);

    // Get the edited row data
    const rowData = sheet.getRange(editedRow, 1, 1, 7).getValues()[0];

    // Validate required fields
    if (!rowData[0] || !rowData[2] || !rowData[5]) {
      Logger.log(`Row ${editedRow}: Missing required data, skipping sync`);
      return;
    }

    // Prepare entry object
    const entry = {
      no: rowData[0],
      id: rowData[1] || '',
      fullName: rowData[2],
      function: rowData[3] || 'Unknown',
      subDepartment: rowData[4] || '',
      account: rowData[5],
      points: parseInt(rowData[6]) || 0,
      rank: editedRow - 1 // Approximate rank based on row position
    };

    // Sync to Firebase
    const result = syncLeaderboardEntryToFirebase(entry);

    if (result.success) {
      Logger.log(`Successfully auto-synced row ${editedRow} to Firebase`);
    } else {
      Logger.log(`Failed to auto-sync row ${editedRow}: ${result.error}`);
    }

  } catch (error) {
    Logger.log(`Exception in onEditLeaderboardSync: ${error.toString()}`);
  }
}

/**
 * Generate unique document ID for leaderboard entry
 * @param {Object} entry - The leaderboard entry data
 * @returns {string} - Unique document ID
 */
function generateLeaderboardDocumentId(entry) {
  const sanitizedEmail = entry.account.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedSubDept = (entry.subDepartment || 'none').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${entry.no}_${sanitizedEmail}_${sanitizedSubDept}`;
}

/**
 * Delete a leaderboard entry from Firebase by unique ID
 * @param {string} documentId - The unique document ID to delete
 */
function deleteLeaderboardEntryFromFirebase(documentId) {
  try {
    if (!documentId) {
      return { success: false, error: 'Missing document ID' };
    }

    const url = `${FIRESTORE_BASE_URL}/${FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD}/${documentId}`;

    const options = {
      method: 'delete',
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 204) {
      Logger.log(`Successfully deleted entry: ${documentId}`);
      return { success: true };
    } else {
      Logger.log(`Error deleting entry: ${response.getContentText()}`);
      return { success: false, error: response.getContentText() };
    }

  } catch (error) {
    Logger.log(`Exception deleting entry from Firebase: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Delete all entries for a specific account (useful for cleanup)
 * @param {string} account - The account email to delete all entries for
 */
function deleteAllEntriesForAccount(account) {
  try {
    if (!account) {
      return { success: false, error: 'Missing account' };
    }

    // Query all documents for this account
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const sanitizedEmail = account.replace(/[^a-zA-Z0-9_-]/g, '_');

    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'account' },
            op: 'EQUAL',
            value: { stringValue: account }
          }
        }
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());

    if (!results || results.length === 0) {
      Logger.log(`No entries found for account: ${account}`);
      return { success: true, deleted: 0 };
    }

    let deletedCount = 0;

    // Delete each document
    results.forEach((item) => {
      if (item.document && item.document.name) {
        const documentName = item.document.name;
        const deleteUrl = `https://firestore.googleapis.com/v1/${documentName}`;

        const deleteOptions = {
          method: 'delete',
          muteHttpExceptions: true
        };

        const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
        if (deleteResponse.getResponseCode() === 200) {
          deletedCount++;
        }
      }
    });

    Logger.log(`Deleted ${deletedCount} entries for account: ${account}`);
    return { success: true, deleted: deletedCount };

  } catch (error) {
    Logger.log(`Exception deleting entries for account: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Clear all entries from Firebase individual-leaderboard collection
 * WARNING: This will delete all leaderboard data from Firebase!
 */
function clearFirebaseLeaderboard() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Firebase Leaderboard',
    'Are you sure you want to delete ALL leaderboard entries from Firebase? This cannot be undone!',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('Clear operation cancelled by user');
    return;
  }

  try {
    // Query all documents in the collection
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());

    if (!results || results.length === 0) {
      Logger.log('No documents found to delete');
      return { success: true, deleted: 0 };
    }

    let deletedCount = 0;

    // Delete each document
    results.forEach((item) => {
      if (item.document && item.document.name) {
        const documentName = item.document.name;
        const deleteUrl = `https://firestore.googleapis.com/v1/${documentName}`;

        const deleteOptions = {
          method: 'delete',
          muteHttpExceptions: true
        };

        const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
        if (deleteResponse.getResponseCode() === 200) {
          deletedCount++;
        }
      }
    });

    Logger.log(`Cleared ${deletedCount} entries from Firebase`);
    ui.alert('Success', `Deleted ${deletedCount} entries from Firebase leaderboard`, ui.ButtonSet.OK);

    return { success: true, deleted: deletedCount };

  } catch (error) {
    Logger.log(`Exception clearing Firebase: ${error.toString()}`);
    ui.alert('Error', `Failed to clear Firebase: ${error.message}`, ui.ButtonSet.OK);
    return { success: false, error: error.toString() };
  }
}

/**
 * Manual trigger to sync all leaderboard data
 * Add this to a custom menu for easy access
 */
function manualSyncLeaderboard() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Sync Leaderboard to Firebase',
    'This will sync all leaderboard data from the sheet to Firebase. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  ui.alert('Syncing...', 'Please wait while data is being synced to Firebase.', ui.ButtonSet.OK);

  const result = syncAllLeaderboardToFirebase();

  if (result.success) {
    ui.alert(
      'Sync Complete',
      `Successfully synced ${result.synced} entries to Firebase.\nErrors: ${result.errors || 0}`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert('Sync Failed', `Error: ${result.error}`, ui.ButtonSet.OK);
  }
}

/**
 * Clean up old/duplicate entries and resync with new unique IDs
 * This is useful if you had entries with old ID format (just email)
 */
function cleanupAndResyncLeaderboard() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Cleanup and Resync',
    'This will:\n1. Clear ALL existing leaderboard entries from Firebase\n2. Resync all data from sheet with NEW unique IDs\n\nThis ensures no duplicates. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    // Step 1: Clear all existing entries
    ui.alert('Step 1/2', 'Clearing old entries from Firebase...', ui.ButtonSet.OK);

    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());

    let deletedCount = 0;
    if (results && results.length > 0) {
      results.forEach((item) => {
        if (item.document && item.document.name) {
          const documentName = item.document.name;
          const deleteUrl = `https://firestore.googleapis.com/v1/${documentName}`;

          const deleteOptions = {
            method: 'delete',
            muteHttpExceptions: true
          };

          const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
          if (deleteResponse.getResponseCode() === 200) {
            deletedCount++;
          }
        }
      });
    }

    Logger.log(`Deleted ${deletedCount} old entries`);

    // Step 2: Resync all data with new unique IDs
    ui.alert('Step 2/2', 'Syncing all data with new unique IDs...', ui.ButtonSet.OK);

    const syncResult = syncAllLeaderboardToFirebase();

    if (syncResult.success) {
      ui.alert(
        'Cleanup Complete! ✅',
        `Successfully cleaned up and resynced!\n\n` +
        `• Deleted: ${deletedCount} old entries\n` +
        `• Synced: ${syncResult.synced} entries with unique IDs\n` +
        `• Errors: ${syncResult.errors || 0}\n\n` +
        `All ${syncResult.synced} records should now be in Firebase!`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('Error', `Cleanup succeeded but resync failed: ${syncResult.error}`, ui.ButtonSet.OK);
    }

  } catch (error) {
    Logger.log(`Exception in cleanupAndResyncLeaderboard: ${error.toString()}`);
    ui.alert('Error', `Cleanup failed: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * View sync statistics
 */
function viewSyncStatistics() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Count sheet rows
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(LEADERBOARD_SHEET_NAME) ||
      spreadsheet.getSheetByName('AI for Everyone') ||
      spreadsheet.getSheetByName('Leaderboard') ||
      spreadsheet.getActiveSheet();

    const lastRow = sheet.getLastRow();
    const sheetCount = Math.max(0, lastRow - 1); // Exclude header

    // Count Firebase documents
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());
    const firebaseCount = results ? results.length : 0;

    const status = sheetCount === firebaseCount ? '✅ In Sync' : '⚠️ Out of Sync';

    ui.alert(
      'Sync Statistics',
      `${status}\n\n` +
      `📊 Google Sheet: ${sheetCount} records\n` +
      `🔥 Firebase: ${firebaseCount} documents\n\n` +
      `${sheetCount !== firebaseCount ? 'Recommendation: Run "Cleanup and Resync" to fix discrepancy.' : 'Everything looks good!'}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Error', `Failed to get statistics: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Add custom menu to Google Sheets UI
 * This runs automatically when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔥 Firebase Sync')
    .addSubMenu(ui.createMenu('👤 Individual Leaderboard')
      .addItem('📊 Sync Individual to Firebase', 'manualSyncLeaderboard')
      .addItem('🧹 Cleanup and Resync Individual', 'cleanupAndResyncLeaderboard')
      .addItem('📈 View Individual Statistics', 'viewSyncStatistics')
      .addItem('🗑️ Clear Individual Data', 'clearFirebaseLeaderboard'))
    .addSubMenu(ui.createMenu('👥 Team Leaderboard')
      .addItem('📊 Sync Team to Firebase', 'manualSyncTeamLeaderboard')
      .addItem('🧹 Cleanup and Resync Team', 'cleanupAndResyncTeamLeaderboard')
      .addItem('📈 View Team Statistics', 'viewTeamSyncStatistics')
      .addItem('🗑️ Clear Team Data', 'clearFirebaseTeamLeaderboard'))
    .addSeparator()
    .addItem('🔄 Sync Playbooks to Firebase', 'syncDataSheetToFirebase')
    .addToUi();
}

/**
 * Install the onEdit trigger for automatic syncing
 * Run this once to set up automatic syncing
 */
function installLeaderboardSyncTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditLeaderboardSync') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger
  ScriptApp.newTrigger('onEditLeaderboardSync')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  Logger.log('Leaderboard sync trigger installed successfully');
  SpreadsheetApp.getUi().alert('Success', 'Automatic sync trigger installed! The leaderboard will now sync to Firebase whenever you edit it.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Uninstall the onEdit trigger
 */
function uninstallLeaderboardSyncTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditLeaderboardSync') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  Logger.log(`Removed ${removed} leaderboard sync triggers`);
  SpreadsheetApp.getUi().alert('Success', `Removed ${removed} automatic sync trigger(s).`, SpreadsheetApp.getUi().ButtonSet.OK);
}

// =============================================================================
// TEAM LEADERBOARD SYNC TO FIREBASE
// =============================================================================

/**
 * Sync a single team leaderboard entry to Firebase
 * @param {Object} entry - The team leaderboard entry data
 * @returns {Object} - Result object with success status
 */
function syncTeamLeaderboardEntryToFirebase(entry) {
  try {
    if (!entry || !entry.function) {
      Logger.log('Invalid team entry: missing function');
      return { success: false, error: 'Missing function' };
    }

    // Create UNIQUE document ID for team entries
    // Format: {no}_{sanitized_function}_{sanitized_subdept}
    const sanitizedFunction = entry.function.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedSubDept = (entry.subDepartment || 'none').replace(/[^a-zA-Z0-9_-]/g, '_');
    const documentId = `${entry.no}_${sanitizedFunction}_${sanitizedSubDept}`;

    Logger.log(`Creating/updating team document with ID: ${documentId}`);

    const url = `${FIRESTORE_BASE_URL}/${FIRESTORE_COLLECTION_TEAM_LEADERBOARD}/${documentId}`;

    // Prepare Firestore document structure for team data
    const firestoreData = {
      fields: {
        no: { integerValue: entry.no.toString() },
        function: { stringValue: entry.function },
        subDepartment: { stringValue: entry.subDepartment || '' },
        account: { stringValue: entry.account || '' },
        accumulatedPoints: { integerValue: entry.accumulatedPoints.toString() },
        teamSize: { integerValue: entry.teamSize.toString() },
        pointsPerEmployee: { doubleValue: entry.pointsPerEmployee },
        rank: { integerValue: entry.rank.toString() },
        uniqueId: { stringValue: documentId },
        lastUpdated: { timestampValue: new Date().toISOString() }
      }
    };

    const options = {
      method: 'patch',
      contentType: 'application/json',
      payload: JSON.stringify(firestoreData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log(`Successfully synced team entry: ${documentId} (${entry.function} - ${entry.subDepartment})`);
      return { success: true, documentId: documentId };
    } else {
      Logger.log(`Error syncing team entry: ${response.getContentText()}`);
      return { success: false, error: response.getContentText() };
    }

  } catch (error) {
    Logger.log(`Exception syncing team entry to Firebase: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Sync all team leaderboard data from sheet to Firebase
 * Reads team leaderboard sheet and syncs to Firebase
 */
function syncAllTeamLeaderboardToFirebase() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Get the team leaderboard sheet
    const sheet = spreadsheet.getSheetByName(TEAM_LEADERBOARD_SHEET_NAME) ||
      spreadsheet.getSheetByName('Leaderboard by Account/Department') ||
      spreadsheet.getSheetByName('Team Leaderboard');

    if (!sheet) {
      Logger.log('Team leaderboard sheet not found');
      return {
        success: false,
        error: 'Team leaderboard sheet not found. Please update TEAM_LEADERBOARD_SHEET_NAME constant.',
        synced: 0
      };
    }

    Logger.log(`Syncing team data from sheet: ${sheet.getName()}`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No team data to sync (only header or empty sheet)');
      return { success: true, message: 'No data to sync', synced: 0 };
    }

    // Get all data (columns A-G: No, Function, Sub-dept, Account, Accumulated Points, Team Size, Points per Employee)
    const range = sheet.getRange(2, 1, lastRow - 1, 7); // Skip header row
    const data = range.getValues();

    Logger.log(`Found ${data.length} team rows to process`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    data.forEach((row, index) => {
      // Skip empty rows - must have No and Function
      if (!row[0] || !row[1]) {
        Logger.log(`Skipping team row ${index + 2}: missing required data`);
        return;
      }

      // Calculate points per employee if not provided
      const teamSize = parseInt(row[5]) || 1;
      const accumulatedPoints = parseInt(row[4]) || 0;
      const pointsPerEmployee = row[6] ? parseFloat(row[6]) : (accumulatedPoints / teamSize);

      const entry = {
        no: row[0],
        function: row[1],
        subDepartment: row[2] || '',
        account: row[3] || '',
        accumulatedPoints: accumulatedPoints,
        teamSize: teamSize,
        pointsPerEmployee: pointsPerEmployee,
        rank: index + 1 // Will be recalculated based on points
      };

      const result = syncTeamLeaderboardEntryToFirebase(entry);

      if (result.success) {
        syncedCount++;
      } else {
        errorCount++;
        errors.push({ row: index + 2, function: entry.function, error: result.error });
      }

      // Add a small delay to avoid rate limiting
      if ((index + 1) % 10 === 0) {
        Utilities.sleep(500);
      }
    });

    Logger.log(`Team sync completed: ${syncedCount} succeeded, ${errorCount} failed`);

    if (errors.length > 0) {
      Logger.log('Team sync errors:', JSON.stringify(errors));
    }

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      errorDetails: errors
    };

  } catch (error) {
    Logger.log(`Exception in syncAllTeamLeaderboardToFirebase: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Watch for changes in the team leaderboard sheet and sync to Firebase
 * This function is triggered automatically when the sheet is edited
 */
function onEditTeamLeaderboardSync(e) {
  try {
    // Check if the edit happened in the team leaderboard sheet
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();

    if (sheetName !== TEAM_LEADERBOARD_SHEET_NAME &&
      sheetName !== 'Leaderboard by Account/Department' &&
      sheetName !== 'Team Leaderboard') {
      return; // Not the team leaderboard sheet, ignore
    }

    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();

    // Only process if editing data rows (not header) and relevant columns (A-G)
    if (editedRow <= 1 || editedCol > 7) {
      return;
    }

    Logger.log(`Detected edit in team sheet ${sheetName} at row ${editedRow}, column ${editedCol}`);

    // Get the edited row data
    const rowData = sheet.getRange(editedRow, 1, 1, 7).getValues()[0];

    // Validate required fields
    if (!rowData[0] || !rowData[1]) {
      Logger.log(`Team row ${editedRow}: Missing required data, skipping sync`);
      return;
    }

    // Calculate points per employee
    const teamSize = parseInt(rowData[5]) || 1;
    const accumulatedPoints = parseInt(rowData[4]) || 0;
    const pointsPerEmployee = rowData[6] ? parseFloat(rowData[6]) : (accumulatedPoints / teamSize);

    // Prepare entry object
    const entry = {
      no: rowData[0],
      function: rowData[1],
      subDepartment: rowData[2] || '',
      account: rowData[3] || '',
      accumulatedPoints: accumulatedPoints,
      teamSize: teamSize,
      pointsPerEmployee: pointsPerEmployee,
      rank: editedRow - 1
    };

    // Sync to Firebase
    const result = syncTeamLeaderboardEntryToFirebase(entry);

    if (result.success) {
      Logger.log(`Successfully auto-synced team row ${editedRow} to Firebase`);
    } else {
      Logger.log(`Failed to auto-sync team row ${editedRow}: ${result.error}`);
    }

  } catch (error) {
    Logger.log(`Exception in onEditTeamLeaderboardSync: ${error.toString()}`);
  }
}

/**
 * Delete a team leaderboard entry from Firebase by unique ID
 * @param {string} documentId - The unique document ID to delete
 */
function deleteTeamLeaderboardEntryFromFirebase(documentId) {
  try {
    if (!documentId) {
      return { success: false, error: 'Missing document ID' };
    }

    const url = `${FIRESTORE_BASE_URL}/${FIRESTORE_COLLECTION_TEAM_LEADERBOARD}/${documentId}`;

    const options = {
      method: 'delete',
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 204) {
      Logger.log(`Successfully deleted team entry: ${documentId}`);
      return { success: true };
    } else {
      Logger.log(`Error deleting team entry: ${response.getContentText()}`);
      return { success: false, error: response.getContentText() };
    }

  } catch (error) {
    Logger.log(`Exception deleting team entry from Firebase: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Clear all entries from Firebase team-leaderboard collection
 * WARNING: This will delete all team leaderboard data from Firebase!
 */
function clearFirebaseTeamLeaderboard() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Firebase Team Leaderboard',
    'Are you sure you want to delete ALL team leaderboard entries from Firebase? This cannot be undone!',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('Clear team operation cancelled by user');
    return;
  }

  try {
    // Query all documents in the team collection
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_TEAM_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());

    if (!results || results.length === 0) {
      Logger.log('No team documents found to delete');
      return { success: true, deleted: 0 };
    }

    let deletedCount = 0;

    // Delete each document
    results.forEach((item) => {
      if (item.document && item.document.name) {
        const documentName = item.document.name;
        const deleteUrl = `https://firestore.googleapis.com/v1/${documentName}`;

        const deleteOptions = {
          method: 'delete',
          muteHttpExceptions: true
        };

        const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
        if (deleteResponse.getResponseCode() === 200) {
          deletedCount++;
        }
      }
    });

    Logger.log(`Cleared ${deletedCount} team entries from Firebase`);
    ui.alert('Success', `Deleted ${deletedCount} entries from Firebase team leaderboard`, ui.ButtonSet.OK);

    return { success: true, deleted: deletedCount };

  } catch (error) {
    Logger.log(`Exception clearing Firebase team leaderboard: ${error.toString()}`);
    ui.alert('Error', `Failed to clear Firebase: ${error.message}`, ui.ButtonSet.OK);
    return { success: false, error: error.toString() };
  }
}

/**
 * Manual trigger to sync all team leaderboard data
 */
function manualSyncTeamLeaderboard() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Sync Team Leaderboard to Firebase',
    'This will sync all team leaderboard data from the sheet to Firebase. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  ui.alert('Syncing...', 'Please wait while team data is being synced to Firebase.', ui.ButtonSet.OK);

  const result = syncAllTeamLeaderboardToFirebase();

  if (result.success) {
    ui.alert(
      'Team Sync Complete',
      `Successfully synced ${result.synced} team entries to Firebase.\nErrors: ${result.errors || 0}`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert('Team Sync Failed', `Error: ${result.error}`, ui.ButtonSet.OK);
  }
}

/**
 * Clean up and resync team leaderboard with new unique IDs
 */
function cleanupAndResyncTeamLeaderboard() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Cleanup and Resync Team Leaderboard',
    'This will:\n1. Clear ALL existing team leaderboard entries from Firebase\n2. Resync all team data from sheet with unique IDs\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    // Step 1: Clear all existing team entries
    ui.alert('Step 1/2', 'Clearing old team entries from Firebase...', ui.ButtonSet.OK);

    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_TEAM_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());

    let deletedCount = 0;
    if (results && results.length > 0) {
      results.forEach((item) => {
        if (item.document && item.document.name) {
          const documentName = item.document.name;
          const deleteUrl = `https://firestore.googleapis.com/v1/${documentName}`;

          const deleteOptions = {
            method: 'delete',
            muteHttpExceptions: true
          };

          const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
          if (deleteResponse.getResponseCode() === 200) {
            deletedCount++;
          }
        }
      });
    }

    Logger.log(`Deleted ${deletedCount} old team entries`);

    // Step 2: Resync all team data
    ui.alert('Step 2/2', 'Syncing all team data with new unique IDs...', ui.ButtonSet.OK);

    const syncResult = syncAllTeamLeaderboardToFirebase();

    if (syncResult.success) {
      ui.alert(
        'Team Cleanup Complete! ✅',
        `Successfully cleaned up and resynced team data!\n\n` +
        `• Deleted: ${deletedCount} old entries\n` +
        `• Synced: ${syncResult.synced} team entries\n` +
        `• Errors: ${syncResult.errors || 0}\n\n` +
        `All ${syncResult.synced} team records should now be in Firebase!`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('Error', `Cleanup succeeded but resync failed: ${syncResult.error}`, ui.ButtonSet.OK);
    }

  } catch (error) {
    Logger.log(`Exception in cleanupAndResyncTeamLeaderboard: ${error.toString()}`);
    ui.alert('Error', `Cleanup failed: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * View team sync statistics
 */
function viewTeamSyncStatistics() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Count sheet rows
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(TEAM_LEADERBOARD_SHEET_NAME) ||
      spreadsheet.getSheetByName('Leaderboard by Account/Department') ||
      spreadsheet.getSheetByName('Team Leaderboard');

    if (!sheet) {
      ui.alert('Error', 'Team leaderboard sheet not found. Please update TEAM_LEADERBOARD_SHEET_NAME constant.', ui.ButtonSet.OK);
      return;
    }

    const lastRow = sheet.getLastRow();
    const sheetCount = Math.max(0, lastRow - 1); // Exclude header

    // Count Firebase documents
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: FIRESTORE_COLLECTION_TEAM_LEADERBOARD }]
      }
    };

    const queryOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    };

    const queryResponse = UrlFetchApp.fetch(queryUrl, queryOptions);
    const results = JSON.parse(queryResponse.getContentText());
    const firebaseCount = results ? results.length : 0;

    const status = sheetCount === firebaseCount ? '✅ In Sync' : '⚠️ Out of Sync';

    ui.alert(
      'Team Sync Statistics',
      `${status}\n\n` +
      `📊 Google Sheet: ${sheetCount} team records\n` +
      `🔥 Firebase: ${firebaseCount} team documents\n\n` +
      `${sheetCount !== firebaseCount ? 'Recommendation: Run "Cleanup and Resync Team" to fix discrepancy.' : 'Everything looks good!'}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Error', `Failed to get team statistics: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Install the onEdit trigger for automatic team leaderboard syncing
 * Run this once to set up automatic syncing for team data
 */
function installTeamLeaderboardSyncTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditTeamLeaderboardSync') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger
  ScriptApp.newTrigger('onEditTeamLeaderboardSync')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  Logger.log('Team leaderboard sync trigger installed successfully');
  SpreadsheetApp.getUi().alert('Success', 'Automatic team sync trigger installed! The team leaderboard will now sync to Firebase whenever you edit it.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Uninstall the team onEdit trigger
 */
function uninstallTeamLeaderboardSyncTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditTeamLeaderboardSync') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  Logger.log(`Removed ${removed} team leaderboard sync triggers`);
  SpreadsheetApp.getUi().alert('Success', `Removed ${removed} automatic team sync trigger(s).`, SpreadsheetApp.getUi().ButtonSet.OK);
}
function syncPlaybookLikes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  Logger.log(`Starting sync for ${data.length} rows...`);

  const LIKE_COLUMN_INDEX = 14;
  const LIKE_COLUMN_SHEET = 15;

  data.forEach((row, index) => {
    const rowNumber = index + 2;

    try {
      const sheetTimestampObject = row[0];
      const email = row[1];

      if (!sheetTimestampObject || !email) {
        Logger.log(`Skipping row ${rowNumber}: Missing Timestamp or Email.`);
        return;
      }

      const standardTimestamp = new Date(sheetTimestampObject).toISOString();
      const sheetKey = createPlaybookKey(email, standardTimestamp);

      const documentName = findDocumentNameByKey(sheetKey);

      if (documentName) {
        const playbookId = documentName.split('/').pop();

        if (!playbookId) {
          Logger.log(`ERROR in row ${rowNumber}: Could not extract playbookId from ${documentName}`);
          sheet.getRange(rowNumber, LIKE_COLUMN_SHEET).setValue(0);
          return;
        }

        const likeCount = countReactionsForPlaybook(playbookId);

        sheet.getRange(rowNumber, LIKE_COLUMN_SHEET).setValue(likeCount);
        Logger.log(`Row ${rowNumber}: Found ${playbookId}. Setting like count = ${likeCount}.`);

      } else {
        Logger.log(`Row ${rowNumber}: Playbook not found for key ${sheetKey}. Setting like count = 0.`);
        sheet.getRange(rowNumber, LIKE_COLUMN_SHEET).setValue(0);
      }

    } catch (error) {
      Logger.log(`ERROR processing row ${rowNumber}: ${error.toString()}`);
      sheet.getRange(rowNumber, LIKE_COLUMN_SHEET).setValue('Error');
    }
  });

  Logger.log('Like sync completed.');
  SpreadsheetApp.getUi().alert('Finished updating like counts!');
}

