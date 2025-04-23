const { sendTask } = require('../services/reminder');

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  try {
    // Defer the button interaction immediately
    await interaction.deferUpdate();

    let page = parseInt(interaction.customId.split('-')[1]) || 0;

    if (interaction.customId === "prevPage") {
      page = Math.max(page - 1, 0);
      await sendTask(interaction, client, page);
    }
    else if (interaction.customId === "nextPage") {
      page += 1;
      await sendTask(interaction, client, page);
    }
    else if (interaction.customId === "toggleEphemeralOff") {
      // Handle the Show Everyone button
      await interaction.update({
        content: "Task completion will now be visible to everyone in the channel!",
        ephemeral: false,  // Make the content visible to everyone
      });
    }
  } catch (error) {
    console.error('Pagination error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Failed to update page.', ephemeral: true });
    }
  }
};
