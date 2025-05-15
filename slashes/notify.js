const { SlashCommandBuilder } = require('discord.js');
const { markNotify } = require('../services/markNotify');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notify')
    .setDescription('Enable or disable notifications.')
    .addBooleanOption(option =>
      option.setName('value')
        .setDescription('TRUE to enable, FALSE to disable')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const value = interaction.options.getBoolean('value');

    try {
      const success = await markNotify(userId, value);
      if (success) {
        await interaction.reply({
          content: `✅ Notifications have been set to **${value ? 'enabled' : 'disabled'}**.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ Your user ID was not found in the sheet.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '⚠️ Error accessing the spreadsheet.',
        ephemeral: true
      });
    }
  }
};
