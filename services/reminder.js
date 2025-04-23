const { google } = require("googleapis");
const { EmbedBuilder } = require("discord.js");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Function to add a task to the Google Sheet
async function addTask(task, description, date, userID) {
  const spreadsheetId = process.env.SHEET_ID;
  const range = `${userID}!C6:F`;
  const values = [[task, description, date, "FALSE", ""]];

  const resource = { values };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      resource,
    });
    console.log("Task added successfully");
  } catch (error) {
    console.error("Error adding task:", error);
    throw new Error("Failed to add task.");
  }
}

// Send Task function to show tasks
async function sendTask(interaction, client, page = 0, public = false) {
  const spreadsheetId = process.env.SHEET_ID;
  const userID = interaction.user.id;
  const range = `${userID}!C6:F`;
  const channel = interaction.channel;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    if (rows.length === 0) {
      await channel.send(`📭 You don’t have any tasks yet, ${interaction.user.tag}!`);
      return;
    }

    const indexedRows = rows
      .map((row, index) => ({
        task: row[0],
        desc: row[1],
        date: row[2],
        done: row[3],
        originalIndex: index,
      }));

    const incompleteRows = indexedRows.filter(row => row.done !== "TRUE");

    if (incompleteRows.length === 0) {
      const replyPayload = {
        content: "🎉 All tasks are completed! Nothing left to do.",
        components: [],
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(replyPayload);
      } else {
        await interaction.reply({ ...replyPayload, ephemeral: !public });
      }
      return;
    }

    const sortedRows = incompleteRows.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    });

    const tasksPerPage = 5;
    const totalPages = Math.ceil(sortedRows.length / tasksPerPage);

    const startIndex = page * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const limitedRows = sortedRows.slice(startIndex, endIndex);

    const taskList = limitedRows.map((row, i) => {
      const taskIndex = startIndex + i + 1;
      if (!row.date) return `**${taskIndex}. ${row.task}**📅 No date\n-# - ${row.desc}`;

      const parsedDate = new Date(row.date);
      if (isNaN(parsedDate)) {
        return `**${taskIndex}. ${row.task}**⚠️ Invalid date\n-# - ${row.desc}`;
      }

      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${taskIndex}. ${row.task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${row.desc}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({ text: `Page ${page + 1} / ${totalPages} | Press the button to mark it as complete!`, iconURL: client.user.displayAvatarURL() });

    const buttons = limitedRows.map((row, i) => ({
      type: 2,
      label: `${startIndex + i + 1}`,
      style: 1,
      custom_id: `markDone-${row.originalIndex}-${startIndex + i + 1}`,
    }));

    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      buttonRows.push({
        type: 1, // Action Row
        components: buttons.slice(i, i + 5),
      });
    }

    const paginationButtons = [
      {
        type: 2,
        label: "Prev",
        style: 1,
        custom_id: "prevPage",
        disabled: page === 0,
      },
      {
        type: 2,
        label: "Next",
        style: 1,
        custom_id: "nextPage",
        disabled: startIndex + tasksPerPage >= sortedRows.length || Math.ceil(sortedRows.length / tasksPerPage) === 1,
      },
    ];

    const paginationRow = {
      type: 1,
      components: paginationButtons,
    };
    buttonRows.push(paginationRow);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: buttonRows,
        ephemeral: !public,
      });
    }

  } catch (err) {
    console.error("Error reading sheet:", err.response?.data || err.message || err);
    await interaction.followUp({
      content: "⚠️ Couldn't fetch tasks...",
      ephemeral: true,
    });
  }
}

// Delete Task function (new)
async function deleteTask(interaction, client, page = 0, public = false) {
  const spreadsheetId = process.env.SHEET_ID;
  const userID = interaction.user.id;
  const range = `${userID}!C6:F`;
  const channel = interaction.channel;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    if (rows.length === 0) {
      await channel.send(`📭 You don’t have any tasks yet, ${interaction.user.tag}!`);
      return;
    }

    const indexedRows = rows
      .map((row, index) => ({
        task: row[0],
        desc: row[1],
        date: row[2],
        done: row[3],
        originalIndex: index,
      }));

    const incompleteRows = indexedRows.filter(row => row.done !== "TRUE");

    if (incompleteRows.length === 0) {
      const replyPayload = {
        content: "🎉 All tasks are completed! Nothing left to delete.",
        components: [],
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(replyPayload);
      } else {
        await interaction.reply({ ...replyPayload, ephemeral: !public });
      }
      return;
    }

    const sortedRows = incompleteRows.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    });

    const tasksPerPage = 5;
    const startIndex = page * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const limitedRows = sortedRows.slice(startIndex, endIndex);

    const taskList = limitedRows.map((row, i) => {
      const taskIndex = startIndex + i + 1;
      if (!row.date) return `**${taskIndex}. ${row.task}**📅 No date\n-# - ${row.desc}`;

      const parsedDate = new Date(row.date);
      if (isNaN(parsedDate)) {
        return `**${taskIndex}. ${row.task}**⚠️ Invalid date\n-# - ${row.desc}`;
      }

      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${taskIndex}. ${row.task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${row.desc}`;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({ text: `Page ${page + 1} / ${Math.ceil(sortedRows.length / tasksPerPage)} | Press the button to delete a task!`, iconURL: client.user.displayAvatarURL() });

    const buttons = limitedRows.map((row, i) => ({
      type: 2,
      label: `Delete ${startIndex + i + 1}`,
      style: 4,  // Red style for danger (delete)
      custom_id: `deleteTask-${row.originalIndex}-${startIndex + i + 1}`,
    }));

    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      buttonRows.push({
        type: 1, // Action Row
        components: buttons.slice(i, i + 5),
      });
    }

    const paginationButtons = [
      {
        type: 2,
        label: "Prev",
        style: 1,
        custom_id: "prevPage",
        disabled: page === 0,
      },
      {
        type: 2,
        label: "Next",
        style: 1,
        custom_id: "nextPage",
        disabled: startIndex + tasksPerPage >= sortedRows.length || Math.ceil(sortedRows.length / tasksPerPage) === 1,
      },
    ];

    const paginationRow = {
      type: 1,
      components: paginationButtons,
    };
    buttonRows.push(paginationRow);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: buttonRows,
        ephemeral: !public,
      });
    }

  } catch (err) {
    console.error("Error reading sheet:", err.response?.data || err.message || err);
    await interaction.followUp({
      content: "⚠️ Couldn't fetch tasks...",
      ephemeral: true,
    });
  }
}

module.exports = { sendTask, addTask, deleteTask };
