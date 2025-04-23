const { SlashCommandBuilder } = require("discord.js");
const { userSetup } = require("../services/userSetup");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("ytta")
    .addStringOption(option =>
      option.setName("password")
        .setDescription("time to turn back now..")
        .setRequired(true)
    ),

  async execute(interaction) {
    const inputPassword = interaction.options.getString("password");
    const correctPassword = process.env.SETUP_PASSWORD;

    if (inputPassword !== correctPassword) {
      await interaction.reply({
        content: "🚫 Incorrect password. Access denied.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await userSetup(interaction.user);

      await interaction.editReply({
        content: "✅ Setup complete! You're good to go!",
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "⚠️ Something went wrong during setup.",
      });
    }
  }
};
