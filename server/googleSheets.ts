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
    
    console.log(`[Google Sheets] Writing result for ${result.studentId} (${result.unit})`);
    
    // 1. 시험결과 탭에 요약 저장
    console.log(`[Google Sheets] Writing summary to 시험결과 tab...`);
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
    console.log(`[Google Sheets] ✓ Summary written successfully`);

    // 2. 문항통계 탭에 집계 데이터 업데이트
    console.log(`[Google Sheets] Updating question statistics...`);
    await updateQuestionStats(spreadsheetId, result.unit, JSON.parse(result.answers));
    console.log(`[Google Sheets] ✓ Question statistics updated`);

    console.log(`[Google Sheets] ✅ All data written successfully for ${result.studentId}`);
    return true;
  } catch (error: any) {
    console.error('❌ [Google Sheets] Error writing result:', error.message);
    console.error('Full error:', error);
    throw error; // Re-throw so caller knows it failed
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
      if (sheetName === '문항통계') {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A1:K1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['단원', '문제번호', '정답', '총응시수', '오답수', '1번선택', '2번선택', '3번선택', '4번선택', '5번선택', '최종수정일시']],
          },
        });
      }
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error);
  }
}

// 문항 통계 업데이트 (집계 방식)
async function updateQuestionStats(spreadsheetId: string, unit: string, studentAnswers: any[]) {
  try {
    // 문항통계 시트 확인 및 생성
    await ensureSheetExists(spreadsheetId, '문항통계');
    
    const sheets = await getUncachableGoogleSheetClient();
    const timestamp = new Date().toLocaleString('ko-KR');
    
    // 기존 통계 읽기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'문항통계'!A2:K",
    });

    const existingRows = response.data.values || [];
    const statsMap = new Map<string, any>();
    
    // 기존 데이터를 맵으로 변환
    existingRows.forEach((row, index) => {
      const key = `${row[0]}_${row[1]}`; // 단원_문제번호
      statsMap.set(key, {
        rowIndex: index + 2, // 시트는 1-based, 헤더 제외
        unit: row[0],
        questionId: row[1],
        correctAnswer: row[2],
        totalAttempts: parseInt(row[3]) || 0,
        wrongAttempts: parseInt(row[4]) || 0,
        answer1: parseInt(row[5]) || 0,
        answer2: parseInt(row[6]) || 0,
        answer3: parseInt(row[7]) || 0,
        answer4: parseInt(row[8]) || 0,
        answer5: parseInt(row[9]) || 0,
      });
    });

    // 새 답안으로 통계 업데이트
    const updatedRows: any[] = [];
    const newRows: any[] = [];

    studentAnswers.forEach((ans: any) => {
      const key = `${unit}_${ans.questionId}`;
      const existing = statsMap.get(key);
      
      if (existing) {
        // 기존 통계 업데이트
        existing.totalAttempts++;
        if (ans.answer !== ans.correctAnswer) {
          existing.wrongAttempts++;
        }
        existing[`answer${ans.answer}`] = (existing[`answer${ans.answer}`] || 0) + 1;
        
        updatedRows.push({
          range: `'문항통계'!A${existing.rowIndex}:K${existing.rowIndex}`,
          values: [[
            existing.unit,
            existing.questionId,
            existing.correctAnswer,
            existing.totalAttempts,
            existing.wrongAttempts,
            existing.answer1,
            existing.answer2,
            existing.answer3,
            existing.answer4,
            existing.answer5,
            timestamp
          ]]
        });
      } else {
        // 새 문제 통계 추가
        const stats = {
          unit,
          questionId: ans.questionId,
          correctAnswer: ans.correctAnswer || '',
          totalAttempts: 1,
          wrongAttempts: ans.answer !== ans.correctAnswer ? 1 : 0,
          answer1: ans.answer === '1' ? 1 : 0,
          answer2: ans.answer === '2' ? 1 : 0,
          answer3: ans.answer === '3' ? 1 : 0,
          answer4: ans.answer === '4' ? 1 : 0,
          answer5: ans.answer === '5' ? 1 : 0,
        };
        
        newRows.push([
          stats.unit,
          stats.questionId,
          stats.correctAnswer,
          stats.totalAttempts,
          stats.wrongAttempts,
          stats.answer1,
          stats.answer2,
          stats.answer3,
          stats.answer4,
          stats.answer5,
          timestamp
        ]);
        
        statsMap.set(key, stats);
      }
    });

    // 배치 업데이트
    if (updatedRows.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updatedRows,
        },
      });
      console.log(`[Google Sheets] Updated ${updatedRows.length} existing question stats`);
    }

    // 새 행 추가
    if (newRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'문항통계'!A:K",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: newRows,
        },
      });
      console.log(`[Google Sheets] Added ${newRows.length} new question stats`);
    }

    return true;
  } catch (error) {
    console.error('Error updating question statistics:', error);
    throw error;
  }
}

// 문항 통계 읽기
export async function readQuestionStats(spreadsheetId: string, unit?: string) {
  try {
    await ensureSheetExists(spreadsheetId, '문항통계');
    
    const sheets = await getUncachableGoogleSheetClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'문항통계'!A2:K",
    });

    const rows = response.data.values || [];
    const stats = rows.map(row => ({
      unit: row[0] || '',
      questionId: row[1] || '',
      correctAnswer: row[2] || '',
      totalAttempts: parseInt(row[3]) || 0,
      wrongAttempts: parseInt(row[4]) || 0,
      answerDistribution: {
        '1': parseInt(row[5]) || 0,
        '2': parseInt(row[6]) || 0,
        '3': parseInt(row[7]) || 0,
        '4': parseInt(row[8]) || 0,
        '5': parseInt(row[9]) || 0,
      },
      lastUpdated: row[10] || '',
    }));

    // 단원 필터링
    if (unit) {
      return stats.filter(s => s.unit === unit);
    }
    
    return stats;
  } catch (error) {
    console.error('Error reading question statistics:', error);
    return [];
  }
}

export async function readExamDataFromSheet(spreadsheetId: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '기출문제!A2:H',
    });

    const rows = response.data.values || [];
    
    const examData = rows.map(row => ({
      schoolName: row[0] || '',
      year: parseInt(row[1]) || 0,
      semester: row[2] || '',
      questionNumber: parseInt(row[3]) || 0,
      category: row[4] || '',
      unit: row[5] || '',
      answer: row[6] || '',
      isMultipleAnswer: (row[7] || 'N').toUpperCase() === 'Y',
    }));

    return examData;
  } catch (error) {
    console.error('Error reading exam data from Google Sheets:', error);
    throw error;
  }
}

export async function writeExamDataToSheet(spreadsheetId: string, examData: any[]) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    // Ensure "기출문제" sheet exists
    await ensureSheetExists(spreadsheetId, '기출문제');
    
    // Clear existing data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: '기출문제!A:H',
    });

    // Prepare header
    const header = ['학교명', '년도', '학기', '문항번호', '분류', '단원', '정답', '복수정답'];
    
    // Prepare rows
    const rows = examData.map(item => [
      item.schoolName,
      item.year,
      item.semester,
      item.questionNumber,
      item.category,
      item.unit,
      item.answer,
      item.isMultipleAnswer ? 'Y' : 'N',
    ]);

    // Write data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '기출문제!A1:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [header, ...rows],
      },
    });

    console.log(`✅ Wrote ${rows.length} questions to Google Sheets (기출문제 tab)`);
    return true;
  } catch (error) {
    console.error('Error writing exam data to Google Sheets:', error);
    throw error;
  }
}

export async function writeStudentResultToSheet(spreadsheetId: string, result: any) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    // Ensure sheets exist
    await ensureSheetExists(spreadsheetId, '시트2');
    await ensureSheetExists(spreadsheetId, '시트3');
    
    const timestamp = new Date(result.submittedAt).toLocaleString('ko-KR');
    
    // 시트2: 학생용 요약 결과
    const sheet2Header = ['학생ID', '이름', '학교', '시험', '점수', '성취도', '제출일시'];
    
    // Check if header exists, if not add it
    const sheet2Data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '시트2!A1:G1',
    });
    
    if (!sheet2Data.data.values || sheet2Data.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '시트2!A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [sheet2Header],
        },
      });
    }
    
    // Append student result to 시트2
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '시트2!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          result.studentId,
          result.studentName,
          result.exam.schoolName,
          `${result.exam.year}년 ${result.exam.semester}`,
          `${result.score}점`,
          `${result.achievementRate}%`,
          timestamp,
        ]],
      },
    });
    
    // 시트3: 상세 분석 (단원별)
    const sheet3Header = ['학생ID', '이름', '시험', '단원', '정답수', '오답수', '미응시', '성취도', '제출일시'];
    
    const sheet3Data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '시트3!A1:I1',
    });
    
    if (!sheet3Data.data.values || sheet3Data.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '시트3!A1:I1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [sheet3Header],
        },
      });
    }
    
    // Append unit results to 시트3
    const unitRows = result.unitResults.map((unit: any) => [
      result.studentId,
      result.studentName,
      `${result.exam.year}년 ${result.exam.semester}`,
      unit.unit,
      unit.correct,
      unit.wrong,
      unit.unanswered,
      `${unit.achievementRate}%`,
      timestamp,
    ]);
    
    if (unitRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: '시트3!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: unitRows,
        },
      });
    }
    
    console.log(`✅ Wrote student result to Google Sheets (시트2, 시트3)`);
    return true;
  } catch (error) {
    console.error('Error writing student result to Google Sheets:', error);
    throw error;
  }
}

export async function readAllResultsFromSheet(spreadsheetId: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    await ensureSheetExists(spreadsheetId, '시트3');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '시트3!A2:I',
    });

    const rows = response.data.values || [];
    
    return rows.map(row => ({
      studentId: row[0] || '',
      studentName: row[1] || '',
      exam: row[2] || '',
      unit: row[3] || '',
      correct: parseInt(row[4] || '0'),
      wrong: parseInt(row[5] || '0'),
      unanswered: parseInt(row[6] || '0'),
      achievementRate: parseInt(row[7]?.replace('%', '') || '0'),
      submittedAt: row[8] || '',
    }));
  } catch (error) {
    console.error('Error reading all results from Google Sheets (시트3):', error);
    return [];
  }
}
