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
    const timestamp = new Date(result.submittedAt).toLocaleString('ko-KR');
    
    // 1. 시험결과 탭에 요약 저장
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '시험결과!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          result.studentId,
          result.studentName,
          result.textbook,
          result.unit,
          timestamp,
          `${result.achievementRate}%`,
          result.feedback || ''
        ]],
      },
    });

    // 2. 문항응답 탭 확인 및 생성
    await ensureSheetExists(spreadsheetId, '문항응답');

    // 3. 문항응답 탭에 각 문제별 답안 저장
    const studentAnswers = JSON.parse(result.answers);
    const questionRows = studentAnswers.map((ans: any) => [
      `${result.studentId}_${timestamp}`, // submissionId
      result.studentId,
      result.studentName,
      result.unit,
      ans.questionId,
      ans.answer,
      timestamp
    ]);

    if (questionRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'문항응답'!A:G", // submissionId, 학생ID, 학생이름, 단원, 문제번호, 학생답안, 응시일시
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: questionRows,
        },
      });
    }

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

async function ensureSheetExists(spreadsheetId: string, sheetName: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    // 시트 목록 가져오기
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetExists = metadata.data.sheets?.some(
      sheet => sheet.properties?.title === sheetName
    );

    // 시트가 없으면 생성
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          }],
        },
      });

      // 헤더 추가
      if (sheetName === '문항응답') {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A1:G1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['응시ID', '학생ID', '학생이름', '단원', '문제번호', '학생답안', '응시일시']],
          },
        });
      }
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error);
  }
}

export async function readQuestionResponsesFromSheet(spreadsheetId: string, unit?: string) {
  try {
    // 시트가 없으면 생성
    await ensureSheetExists(spreadsheetId, '문항응답');
    
    const sheets = await getUncachableGoogleSheetClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'문항응답'!A2:G", // submissionId, 학생ID, 학생이름, 단원, 문제번호, 학생답안, 응시일시
    });

    const rows = response.data.values || [];
    const allResponses = rows.map(row => ({
      submissionId: row[0] || '',
      studentId: row[1] || '',
      studentName: row[2] || '',
      unit: row[3] || '',
      questionId: row[4] || '',
      studentAnswer: row[5] || '',
      submittedAt: row[6] || '',
    }));

    // 단원 필터링
    if (unit) {
      return allResponses.filter(r => r.unit === unit);
    }
    
    return allResponses;
  } catch (error) {
    console.error('Error reading question responses from Google Sheets:', error);
    return [];
  }
}
