// Google Apps Script for KMS AI Tips Submission Form
// Deploy this as a web app in your Google Sheet

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
    }).sort((a, b) => b.accumulatedPoints - a.accumulatedPoints); // Sort by accumulated points descending
    
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
        leaderboardJsonp: 'GET /?action=getLeaderboard&callback=yourCallback'
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
