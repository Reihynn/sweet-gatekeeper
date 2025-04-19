const { SlashCommandBuilder } = require("discord.js");
const { sendDailyReminder } = require("../services/reminder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("I’ll get the tasks for you~"),
  async execute(interaction) {
    await interaction.reply({ content: "📬 Checking your tasks...", ephemeral: true });
    await sendDailyReminder(interaction);
  }
};