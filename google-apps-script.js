// Google Apps Script for KMS AI Tips Submission Form
// Deploy this as a web app in your Google Sheet

// Firebase Configuration
const FIREBASE_PROJECT_ID = 'kms-ai-leaderboard';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE_TABLE_PLAYBOOKS = 'playbooks';

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

// Function to get playbooks data from Form Responses sheet
function getPlaybooksData() {
  try {
    // Get the Form Responses sheet (you may need to adjust the sheet name)
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Form Responses') || spreadsheet.getSheets()[0];
    
    if (!sheet) {
      return {
        success: false,
        error: 'Form Responses sheet not found',
        playbooks: []
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const timestampIndex = headers.indexOf('Timestamp');
    const emailIndex = headers.indexOf('Email Address');
    const categoryIndex = headers.indexOf('Your Tip Category');
    const descriptionIndex = headers.indexOf('Description of Your Tip');
    const approvalIndex = headers.indexOf('Anh Chanh'); // Assuming first approval column
    
    if (timestampIndex === -1 || emailIndex === -1 || categoryIndex === -1 || descriptionIndex === -1 || approvalIndex === -1) {
      return {
        success: false,
        error: 'Required columns not found in sheet',
        playbooks: []
      };
    }

    const playbooks = [];
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const approval = row[approvalIndex];
      
      // Only include approved entries
      if (approval && approval.toString().toLowerCase().includes('approved')) {
        const timestamp = row[timestampIndex];
        const email = row[emailIndex];
        const category = row[categoryIndex];
        const description = row[descriptionIndex];
        
        // Map category to our internal categories
        let mappedCategory = 'productivity'; // default
        if (category) {
          const cat = category.toString().toLowerCase();
          if (cat.includes('driving operational efficiency') || cat.includes('productivity')) {
            mappedCategory = 'productivity';
          } else if (cat.includes('predictive insights') || cat.includes('data') || cat.includes('analysis')) {
            mappedCategory = 'data';
          } else if (cat.includes('customer experience')) {
            mappedCategory = 'cx';
          } else if (cat.includes('innovation') || cat.includes('creativity')) {
            mappedCategory = 'innovation';
          }
        }
        
        playbooks.push({
          timestamp: timestamp ? timestamp.toString() : '',
          owner: email ? email.toString() : '',
          category: mappedCategory,
          description: description ? description.toString() : ''
        });
      }
    }

    return {
      success: true,
      playbooks: playbooks,
      count: playbooks.length
    };
    
  } catch (error) {
    console.error('Error getting playbooks data:', error);
    return {
      success: false,
      error: error.toString(),
      playbooks: []
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
    const playbooksData = getPlaybooksData();

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
        "from": [{"collectionId": FIRESTORE_TABLE_PLAYBOOKS}],
        "where": {
          "fieldFilter": {
            "field": {"fieldPath": "sheetKey"},
            "op": "EQUAL",
            "value": {"stringValue": sheetKey}
          }
        },
        "limit": 1
      }
    };
    const queryOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
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
        "from": [{"collectionId": FIRESTORE_TABLE_PLAYBOOKS}]
      }
    };

    const queryOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
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
          
          playbooks.push({
            documentName: result.document.name,
            timestamp: fields.timestamp ? fields.timestamp.timestampValue : '',
            owner: fields.email ? fields.email.stringValue : '',
            category: fields.category ? fields.category.stringValue : '',
            description: fields.description ? fields.description.stringValue : '',
            isApproved: fields.isApproved ? fields.isApproved.booleanValue : 'N/A',
            sheetKey: fields.sheetKey ? fields.sheetKey.stringValue : 'N/A'
          });
        }
      });
    }

    Logger.log(`Found ${playbooks.length} total playbooks from Firebase.`);
    Logger.log(JSON.stringify(playbooks, null, 2));
    
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
        sheetKey: { stringValue: key }
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

function updatePlaybookByKey(sheetKey, isApproved) {
  try {
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const queryPayload = {
      "structuredQuery": {
        "from": [{"collectionId": FIRESTORE_TABLE_PLAYBOOKS}],
        "where": {
          "fieldFilter": {
            "field": {"fieldPath": "sheetKey"},
            "op": "EQUAL",
            "value": {"stringValue": sheetKey}
          }
        },
        "limit": 1
      }
    };

    const queryOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
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
      headers: {'Content-Type': 'application/json'},
      payload: JSON.stringify(updatePayload)
    };

    const updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);

    if (updateResponse.getResponseCode() === 200) {
      Logger.log('Successfully updated isApproved to ' + isApproved + ' for document: ' + documentName);
    } else {
      Logger.log('Error updating document: ' + updateResponse.getContentText());
    }

  } catch (error) {
    Logger.log('Exception in updatePlaybookByKey: ' + error.toString());
  }
}

function updateFullPlaybook(documentName, data) {
  try {
    const updateMask = 'updateMask.fieldPaths=category&updateMask.fieldPaths=description&updateMask.fieldPaths=email&updateMask.fieldPaths=isApproved&updateMask.fieldPaths=timestamp&updateMask.fieldPaths=sheetKey';
    const updateUrl = `https://firestore.googleapis.com/v1/${documentName}?${updateMask}`;

    const firestoreData = {
      fields: {
        category: { stringValue: data.category || '' },
        description: { stringValue: data.description || '' },
        email: { stringValue: data.email || '' },
        isApproved: { booleanValue: data.isApproved || false },
        timestamp: { timestampValue: data.timestamp || new Date().toISOString() },
        sheetKey: { stringValue: data.sheetKey }
      }
    };

    const updateOptions = {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      payload: JSON.stringify(updateOptions)
    };

    const updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
    if (updateResponse.getResponseCode() === 200) {
      Logger.log('Successfully UPDATED document: ' + documentName);
    } else {
      Logger.log('Error UPDATING document: ' + updateResponse.getContentText());
    }
  } catch (error) {
    Logger.log('Exception in updateFullPlaybook: ' + error.toString());
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

    if (approvedCount >= 3) {
      const lastColumn = sheet.getLastColumn();
      const fullRecord = sheet.getRange(editedRow, 1, 1, lastColumn).getValues()[0];
      
      Logger.log(`✅ Post at row ${editedRow} is approved with ${approvedCount} votes.`);
      
      const sheetTimestampObject = fullRecord[0];
      const email = fullRecord[1];     
      
      if (!sheetTimestampObject || !email) {
        Logger.log('ERROR: Timestamp (Col A) or Email (Col B) is missing from row. Cannot update Firebase.');
        return;
      }

      const standardTimestamp = new Date(sheetTimestampObject).toISOString();
      const keyToUpdate = createPlaybookKey(email, standardTimestamp);
      
      Logger.log('Generated key for update: ' + keyToUpdate);
      
      updatePlaybookByKey(keyToUpdate, true);

    } else {
      Logger.log(`⏳ Post at row ${editedRow} is not yet approved. Approval count: ${approvedCount}`);
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
      isApproved: (row[10] === "Approved"),
      sheetKey: sheetKey
    };
    
    const documentName = findDocumentNameByKey(sheetKey);

    if (documentName) {
      Logger.log(`Row ${rowNumber}: Found. Updating doc for key ${sheetKey}`);
      updateFullPlaybook(documentName, payload);
    } else {
      Logger.log(`Row ${rowNumber}: Not found. Creating new doc for key ${sheetKey}`);
      savePlaybookToFirebase(payload);
    }
  });

  Logger.log('Sync completed.');
}

