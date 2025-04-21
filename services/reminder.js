const { google } = require("googleapis");
const { EmbedBuilder } = require("discord.js");
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function sendTask(interaction, client, page = 0) {
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

    const tasksPerPage = 5;  // You can adjust the number of tasks per page
    const totalPages = Math.ceil(sortedRows.length / tasksPerPage); // Calculate total pages
    
    const startIndex = page * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const limitedRows = sortedRows.slice(startIndex, endIndex);

    const buttons = limitedRows.map((row, i) => ({
      type: 2,
      label: `${i + 1}`,
      style: 1,
      custom_id: `markDone-${row.originalIndex}-${i + 1}`, // Use originalIndex to track tasks
    }));

    // Create action rows for buttons (grouped in rows of 5)
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      buttonRows.push({
        type: 1, // Action Row
        components: buttons.slice(i, i + 5),
      });
    }

    // Pagination buttons (Prev and Next)
    const paginationButtons = [
      {
        type: 2,
        label: "Prev",
        style: 1,
        custom_id: "prevPage",
        disabled: page === 0,  // Disable "Prev" button on the first page
      },
      {
        type: 2,
        label: "Next",
        style: 1,
        custom_id: "nextPage",
        disabled: startIndex + tasksPerPage >= rows.length,  // Disable "Next" button if last page
      },
    ];

    
    const taskList = limitedRows.map((row, i) => {
      if (!row.date) return `**${i + 1}. ${row.task}**📅 No date\n-# - ${row.desc}`;

      const parsedDate = new Date(row.date);
      if (isNaN(parsedDate)) {
        return `**${i + 1}. ${row.task}**⚠️ Invalid date\n-# - ${row.desc}`;
      }

      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${i + 1}. ${row.task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${row.desc}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({ text: `Page ${page + 1} / ${totalPages} | Press the button to mark it as complete!`, iconURL: client.user.displayAvatarURL() });

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