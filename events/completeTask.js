const { google } = require("googleapis");

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
      const index = parseInt(customId.split("-")[1]);

      const spreadsheetId = process.env.SHEET_ID;
      const range = "Reminders!F6:F"; // Column F (marked as done)

      try {
        // Mark the row as done (TRUE in column F)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Reminders!F${index + 6}`, // +6 because sheet starts at C6
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [["TRUE"]],
          },
        });

        await interaction.reply({
          content: `✅ Task ${index + 1} marked as done!`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("Failed to mark task done:", err);
        await interaction.reply({
          content: "⚠️ Couldn't update task status.",
          ephemeral: true,
        });
      }
    }
  },
};
