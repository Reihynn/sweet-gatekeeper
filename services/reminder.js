const { google } = require("googleapis");
const { EmbedBuilder } = require("discord.js");
const auth = new google.auth.GoogleAuth({
  keyFile: "../credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function sendDailyReminder(interaction) {
  const spreadsheetId = "1Lad6LgQVZQOuOARJRYR3R7l6uPwlROkdUWeuTbydiI0"; // Replace with your ID
  const range = "Reminders!C6:F";
  const channel = interaction.channel;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    if (rows.length === 0) {
      await channel.send("📭 You don’t have any tasks yet!");
      return;
    }

    const taskList = rows.map(([task, desc, date], i) => {
      if (!date) return `**${i + 1}. ${task}**📅 No date\n-# - ${desc}`;

      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        return `**${i + 1}. ${task}**⚠️ Invalid date\n-# - ${desc}`;
      }

      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${i + 1}. ${task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${desc}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({ text: "Synced from Google Sheets", iconURL: client.user.displayAvatarURL() });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error reading sheet:", err);
    await channel.send("⚠️ Couldn't fetch tasks...");
  }
}

module.exports = {
  sendDailyReminder,
};