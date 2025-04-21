
const { google } = require("googleapis");
const { sendTask } = require('../services/reminder');

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith("markDone-")) {
      const parts = interaction.customId.split("-");
      const index = parseInt(parts[1]);
      const displayNumber = parseInt(parts[2]);

      if (isNaN(index) || isNaN(displayNumber)) {
        await interaction.reply({
          content: "⚠️ Invalid task number.",
          ephemeral: true,
        });
        return;
      }

      const spreadsheetId = process.env.SHEET_ID;
      const range = "Reminders!F6:F"; // Column F (marked as done)

      try {
        // First defer the update to acknowledge the button press
        await interaction.deferUpdate();

        // Get total rows to validate index
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Reminders!C6:E"
        });
        
        const rows = response.data.values || [];
        
        if (index < 0 || index >= rows.length) {
          await interaction.followUp({
            content: "⚠️ Invalid task number.",
            ephemeral: true,
          });
          return;
        }

        // Mark the row as done (TRUE in column F)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Reminders!F${6 + index}`, // +6 because sheet starts at row 6
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [["TRUE"]],
          },
        });
        
        // Update the task list
        await sendTask(interaction, interaction.client);
      } catch (err) {
        console.error("Failed to mark task done:", err);
        await interaction.followUp({
          content: "⚠️ Couldn't update task status.",
          ephemeral: true,
        });
      }
    }
  },
};
