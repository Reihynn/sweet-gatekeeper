const { google } = require("googleapis");
const { deleteTask } = require("../services/reminder");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    try {
      if (interaction.customId.startsWith("deleteTask-")) {
        const parts = interaction.customId.split("-");
        const index = parseInt(parts[1]);
        const displayNumber = parseInt(parts[2]);

        if (isNaN(index) || isNaN(displayNumber)) {
          await interaction.followUp({
            content: "⚠️ Invalid task number.",
            flags: 64,
          });
          return;
        }

        const spreadsheetId = process.env.SHEET_ID;
        const userID = interaction.user.id;

        // Validate the index
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${userID}!C6:F`,
        });

        const rows = response.data.values || [];

        if (index < 0 || index >= rows.length) {
          await interaction.followUp({
            content: "⚠️ Invalid task number.",
            flags: 64,
          });
          return;
        }

        // Delete the row (by shifting rows up)
        const deleteRequest = {
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: await getSheetIdByName(userID), // Get sheetId dynamically
                    dimension: "ROWS",
                    startIndex: 5 + index, // C6 = row 6, so add index to 5
                    endIndex: 6 + index,
                  },
                },
              },
            ],
          },
        };

        // Need to fetch sheetId first
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets.find(
          (s) => s.properties.title === userID
        );

        if (!sheet) {
          await interaction.followUp({
            content: "⚠️ Sheet not found.",
            flags: 64,
          });
          return;
        }

        deleteRequest.requestBody.requests[0].deleteDimension.range.sheetId =
          sheet.properties.sheetId;

        await sheets.spreadsheets.batchUpdate(deleteRequest);

        // Refresh the task list by calling deleteTask explicitly
        await deleteTask(interaction, interaction.client);

        await interaction.followUp({
          content: `🗑️ Task ${displayNumber} deleted successfully!`,
          flags: 64,
        });
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate();
      }
      await interaction.followUp({
        content: "⚠️ Something went wrong while deleting the task.",
        flags: 64,
      });
    }
  },
};

// Helper function to get the sheetId by name
async function getSheetIdByName(sheetName) {
  const spreadsheetId = process.env.SHEET_ID;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets.find(
    (s) => s.properties.title === sheetName
  );
  if (!sheet) {
    throw new Error("Sheet not found");
  }
  return sheet.properties.sheetId;
}
