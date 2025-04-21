const { sendTask } = require('../services/reminder'); // Adjust the path as needed

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  let page = 0;  // This can be dynamically handled with a state tracking mechanism like a Map or user data

  // Handle "Prev" button click
  if (interaction.customId === "prevPage") {
    page = Math.max(page - 1, 0); // Prevent going to negative pages
    await sendTask(interaction, client, page); // Send the updated tasks for the previous page
    await interaction.deferUpdate(); // Acknowledge the interaction without replying
  }

  // Handle "Next" button click
  else if (interaction.customId === "nextPage") {
    page += 1; // Increment the page number for the next set of tasks
    await sendTask(interaction, client, page); // Send the updated tasks for the next page
    await interaction.deferUpdate(); // Acknowledge the interaction without replying
  }

  // Handle task marking click (if applicable)
  else if (interaction.customId.startsWith("markDone-")) {
    const [_, originalIndex] = interaction.customId.split("-");
    // Here you can process marking the task as done
    // Example: Update the sheet, change a value, etc.
    await interaction.reply(`Marked task ${originalIndex} as done`);
  }
};
