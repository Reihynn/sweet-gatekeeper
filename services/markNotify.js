const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: 'v4', auth });

async function markNotify(userId, value) {
  const sheetName = 'Users';
  const spreadsheetId = process.env.SHEET_ID;

  // 1. Get the list of user IDs from column B (starting row 2)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B1:B`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return false;

  // 2. Find the row index where userId matches
  const rowIndex = rows.findIndex(row => row[0] === userId);
  if (rowIndex === -1) return false;

  // 3. Calculate the exact row number in the sheet (rowIndex is zero-based)
  const targetRow = rowIndex + 1;

  // 4. Update column C in that row with TRUE or FALSE
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!C${targetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value ? 'TRUE' : 'FALSE']],
    },
  });

  return true;
}

module.exports = { markNotify };
