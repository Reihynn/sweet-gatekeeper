const { SlashCommandBuilder } = require('discord.js');
const { addTask } = require('../services/reminder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('What do you want to do today?')
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
        .setDescription('Due date (e.g., 2025-04-22 00:00)')
        .setRequired(true)),

  async execute(interaction) {
    const task = interaction.options.getString('task');
    const description = interaction.options.getString('description');
    const date = interaction.options.getString('date');

    try {
      await addTask(task, description, date);
      await interaction.reply({ content: '✅ Task added successfully!', ephemeral: true });
    } catch (error) {
      console.error('Error adding task:', error);
      await interaction.reply({ content: '❌ Failed to add task...', ephemeral: true });
    }
  },
};
