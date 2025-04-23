const { SlashCommandBuilder } = require('discord.js');
const { addTask, sendTask, deleteTask } = require('../services/reminder'); // Ensure 'sheets' is imported

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task')
    .setDescription('What do you want to do today~?')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription("Productive much, aren't you?")
        .addStringOption(option =>
          option.setName('task')
            .setDescription('The task name')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('A short description of the task')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('date')
            .setDescription('Due date WIB (e.g., 2025-04-22 00:00)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription("I'll get the tasks for you~")
        .addBooleanOption(option =>
          option.setName("public")
            .setDescription("Set whether to show the tasks publicly or privately")
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Wanna remove something?')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const task = interaction.options.getString('task');
      const description = interaction.options.getString('description');
      const date = interaction.options.getString('date');

      try {
        await addTask(task, description, date, interaction.user.id);
        await interaction.reply({ content: '✅ Task added successfully!', ephemeral: true });
      } catch (error) {
        console.error('Error adding task:', error);
        await interaction.reply({ content: '❌ Failed to add task.', ephemeral: true });
      }

    } else if (subcommand === 'check') {
      const isPublic = interaction.options.getBoolean("public") ?? false;
      await sendTask(interaction, interaction.client, 0, isPublic);

    } else if (subcommand === 'delete') {
      // Instead of complex logic, just call sendTask for deletion (with different button behavior)
      await deleteTask(interaction, interaction.client, 0, false);  // 'false' indicates private for now

    }
  },
};
