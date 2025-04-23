const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = process.env.SHEET_ID;
const USERS_SHEET = "Users"; // Sheet that tracks all users
const TEMPLATE_SHEET_NAME = "Template";

async function userSetup(user) {
  const userId = user.id;
  const username = user.tag;

  // Step 1: Check if user already exists in "Users" sheet
  const usersSheet = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${USERS_SHEET}!A:B`, // Assuming usernames are in column A and user IDs in column B
  });

  const existingUsers = usersSheet.data.values || [];

  const userExists = existingUsers.some(
    (row) => row[1] === userId // Check if user ID already exists in the second column
  );

  if (userExists) {
    console.log(`User ${username} (ID: ${userId}) already exists in Users sheet.`);
    return; // Exit if user already exists
  }

  // Step 2: Add user info to "Users" sheet if it doesn't exist
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${USERS_SHEET}!A:B`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[username, userId]],
    },
  });

  // Step 3: Refresh and check if sheet already exists
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = spreadsheet.data.sheets.some(
    (sheet) => sheet.properties.title === userId
  );
  
  if (!sheetExists) {
    // Get the Template sheet ID
    const templateSheet = spreadsheet.data.sheets.find(
      (sheet) => sheet.properties.title === TEMPLATE_SHEET_NAME
    );

    if (!templateSheet) {
      throw new Error(`Template sheet "${TEMPLATE_SHEET_NAME}" not found.`);
    }

    const templateSheetId = templateSheet.properties.sheetId;

    // Step 4: Duplicate the Template sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            duplicateSheet: {
              sourceSheetId: templateSheetId,
              newSheetName: userId,
            },
          },
        ],
      },
    });

    // Wait a moment to ensure the sheet duplication process completes
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 5: Get updated spreadsheet info and move the new sheet to the rightmost position
    const updatedSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const newSheetIndex = updatedSpreadsheet.data.sheets.findIndex(
      (sheet) => sheet.properties.title === userId
    );

    const totalSheets = updatedSpreadsheet.data.sheets.length;

    if (newSheetIndex !== -1) {
      // Step 6: Move the new sheet to the rightmost position (after the last sheet)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: updatedSpreadsheet.data.sheets[newSheetIndex].properties.sheetId,
                  index: totalSheets - 1, // Move to the rightmost tab
                },
                fields: "index",
              },
            },
          ],
        },
      });
    } else {
      throw new Error(`Failed to create a new sheet for user ${userId}`);
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${userId}'!C2`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[username]],
      },
    });
  }
}

module.exports = { userSetup };
