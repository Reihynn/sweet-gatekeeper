
const { sendTask } = require('../services/reminder');

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  try {
    // Defer the button interaction immediately
    await interaction.deferUpdate();
    
    let page = 0;

    if (interaction.customId === "prevPage") {
      page = Math.max(page - 1, 0);
      await sendTask(interaction, client, page);
    }
    else if (interaction.customId === "nextPage") {
      page += 1;
      await sendTask(interaction, client, page);
    }
  } catch (error) {
    console.error('Pagination error:', error);
    // Only send followUp if we haven't responded yet
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Failed to update page.', ephemeral: true });
    }
  }
};
