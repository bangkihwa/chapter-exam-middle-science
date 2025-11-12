import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function readStudentsFromSheet(spreadsheetId: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '학생정보!A2:D', // Assuming first row is header
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      studentId: row[0] || '',
      studentName: row[1] || '',
      grade: row[2] || '',
      phone: row[3] || '',
    }));
  } catch (error) {
    console.error('Error reading students from Google Sheets:', error);
    return [];
  }
}

export async function writeResultToSheet(spreadsheetId: string, result: any) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '시험결과!A:G', // Assuming columns: 학생ID, 학생이름, 교재이름, 단원, 과제입력일시, 성취율, 피드백
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          result.studentId,
          result.studentName,
          result.textbook,
          result.unit,
          new Date(result.submittedAt).toLocaleString('ko-KR'),
          `${result.achievementRate}%`,
          result.feedback || ''
        ]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error writing result to Google Sheets:', error);
    return false;
  }
}

export async function readResultsFromSheet(spreadsheetId: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '시험결과!A2:G', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      studentId: row[0] || '',
      studentName: row[1] || '',
      textbook: row[2] || '',
      unit: row[3] || '',
      submittedAt: row[4] || '',
      achievementRate: parseInt(row[5]?.replace('%', '') || '0'),
      feedback: row[6] || '',
    }));
  } catch (error) {
    console.error('Error reading results from Google Sheets:', error);
    return [];
  }
}
