const { google } = require("googleapis");
const { EmbedBuilder } = require("discord.js");
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function sendTask(interaction, client) {
  const spreadsheetId = process.env.SHEET_ID;
  const range = "Reminders!C6:E";
  const channel = interaction.channel;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    if (rows.length === 0) {
      await channel.send("📭 You don’t have any tasks yet!");
      return;
    }

    // 1. Map rows to include original index
    const indexedRows = rows.map((row, index) => ({
      task: row[0],
      desc: row[1],
      date: row[2],
      originalIndex: index
    }));

    // 2. Sort by the date (from the row)
    const sortedRows = indexedRows.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateA - dateB;
    });

    
    const taskList = sortedRows.map(([task, desc, date], i) => {
      if (!date) return `**${i + 1}. ${task}**📅 No date\n-# - ${desc}`;

      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        return `**${i + 1}. ${task}**⚠️ Invalid date\n-# - ${desc}`;
      }

      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${i + 1}. ${task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${desc}`;
    }).join("\n");

    const buttons = sortedRows.map(({ originalIndex }, i) => ({
      type: 2,
      label: `${i + 1}`,
      style: 1,
      custom_id: `markDone-${originalIndex}`,
    }));


    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      buttonRows.push({
        type: 1, // Action Row
        components: buttons.slice(i, i + 5),
      });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({ text: "Enjoy your day~", iconURL: client.user.displayAvatarURL() });

    await channel.send({
      embeds: [embed],
      components: buttonRows,
    });
    
  } catch (err) {
    console.error("Error reading sheet:", err);
    await channel.send("⚠️ Couldn't fetch tasks...");
  }
}

async function addTask(task, description, date) {
  const spreadsheetId = process.env.SHEET_ID;
  const range = "Reminders!C6:E";
  const values = [[task, description, date]];
  const resource = { values };

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource,
  });
}

module.exports = {
  sendTask, addTask
};