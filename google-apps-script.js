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

// Function to get leaderboard data (for future use)
function getLeaderboardData() {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const data = sheet.getDataRange().getValues();

        // Skip header row
        const submissions = data.slice(1);

        // Calculate individual leaderboard
        const individualStats = {};
        submissions.forEach(row => {
            const [no, fullName, email, department, submissionType, title, description, tags, attachments, timestamp, status, points] = row;

            if (status === 'Approved' && points) {
                const key = `${fullName} (${email})`;
                if (!individualStats[key]) {
                    individualStats[key] = {
                        name: fullName,
                        email: email,
                        department: department,
                        points: 0,
                        submissions: 0
                    };
                }
                individualStats[key].points += parseInt(points) || 0;
                individualStats[key].submissions += 1;
            }
        });

        // Convert to array and sort by points
        const individualLeaderboard = Object.values(individualStats)
            .sort((a, b) => b.points - a.points);

        return {
            individual: individualLeaderboard,
            lastUpdated: new Date()
        };

    } catch (error) {
        console.error('Error getting leaderboard data:', error);
        return { error: 'Failed to load leaderboard data' };
    }
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
