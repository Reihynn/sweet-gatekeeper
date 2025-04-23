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

    try {
      if (interaction.customId.startsWith("markDone-")) {
        // Handle task marking as done
        const parts = interaction.customId.split("-");
        const index = parseInt(parts[1]);
        const displayNumber = parseInt(parts[2]);

        if (isNaN(index) || isNaN(displayNumber)) {
          await interaction.followUp({
            content: "⚠️ Invalid task number.",
            flags: 64, // Ephemeral flag
          });
          return;
        }

        const spreadsheetId = process.env.SHEET_ID;
        const userID = interaction.user.id;
        // Get total rows to validate index
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${userID}!C6:F`,
        });

        const rows = response.data.values || [];

        if (index < 0 || index >= rows.length) {
          await interaction.followUp({
            content: "⚠️ Invalid task number.",
            flags: 64, // Ephemeral flag
          });
          return;
        }

        // Mark the row as done
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${userID}!F${6 + index}`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [["TRUE"]],
          },
        });

        // Update the task list
        await sendTask(interaction, interaction.client);

        await interaction.followUp({
          content: `✅ Task ${displayNumber} marked as done!`,
          flags: 64, // Ephemeral flag
        });
      }
    } catch (err) {
      console.error("Failed to handle interaction:", err);
      // Ensure that the response to the interaction is sent with an ephemeral flag if it hasn't been acknowledged
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate();
      }
      await interaction.followUp({
        content: "⚠️ Something went wrong.",
        flags: 64, // Ephemeral flag
      });
    }
  },
};
