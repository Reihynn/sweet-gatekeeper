const { google } = require("googleapis");
const fs = require("fs");
const cron = require("node-cron");
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("check")
    .setDescription("I’ll get the tasks for you~"),
  new SlashCommandBuilder()
    .setName("timezone")
    .setDescription("Set your timezone")
    .addStringOption(option =>
      option.setName("timezone")
        .setDescription("Your timezone (e.g. UTC+7 or America/New_York)")
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash command...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // replace with your bot's App ID
      { body: commands },
    );
    console.log("✅ Slash command registered!");
  } catch (error) {
    console.error("Error registering command:", error);
  }
})();

// Authenticate using the credentials file
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

async function sendDailyReminder(channel, interaction) {
  const spreadsheetId = "1Lad6LgQVZQOuOARJRYR3R7l6uPwlROkdUWeuTbydiI0";
  const range = "Reminders!C6:F";

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = res.data.values || [];

    if (rows.length === 0) {
      await channel.send("📭 You don’t have any tasks yet!");
      return;
    }

    const taskList = rows.map(([task, desc, date], index) => {
      if (!date) return `**${index + 1}. ${task}**📅 No date\n-# - ${desc}`;

      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        return `• ${task} — ⚠️ Invalid date`;
      }
      const unix = Math.floor(parsedDate.getTime() / 1000) - 25200;
      return `**${index + 1}. ${task}**📅 <t:${unix}:R> (<t:${unix}:F>)\n-# - ${desc}`;
    }).join("\n");

    // Create Embed

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`🗒️ All Tasks for ${interaction.user.tag} ^^`)
      .setDescription(taskList)
      .setImage("https://reirei.s-ul.eu/1eUOSOOF")
      .setFooter({
        text: "Enjoy your day~",
        iconURL: client.user.displayAvatarURL()});

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Error reading sheet:", err);
    await channel.send("⚠️ Couldn't fetch tasks...");
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "check") {
    const channel = interaction.channel;
    await interaction.reply({
      content: "📬 Checking today’s tasks...",
      flags: 64, // ephemeral
    });
    await sendDailyReminder(channel, interaction);
  }

  if (interaction.commandName === "settimezone") {
  const timezoneInput = interaction.options.getString("timezone");

  // Optional: validate it
  if (!timezoneInput.match(/^UTC[+-]?\d{1,2}$|^[A-Za-z_]+\/[A-Za-z_]+$/)) {
    await interaction.reply({
      content: "❌ Format Invalid, use something like `UTC+7`.",
      flags: 64,
    });
    return;
  }

  // Store the timezone (we'll get into that next)
  // Example: save to a sheet
  const userId = interaction.user.id;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: "YOUR_SHEET_ID",
      range: "Timezones!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, interaction.user.tag, timezoneInput]],
      },
    });

    await interaction.reply({
      content: `✅ Timezone saved as **${timezoneInput}**.`,
      ephemeral: true,
    });
  } catch (err) {
    console.error("Error saving timezone:", err);
    await interaction.reply({
      content: "⚠️ Couldn't save your timezone.",
      ephemeral: true,
    });
  }
  }
});

cron.schedule("0 23 * * *", async () => {
  // Example cron job for a scheduled task if needed
});

client.login(process.env.DISCORD_TOKEN);
