const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Event handlers
const completeTaskHandler = require('./events/completeTask');
const deleteTaskHandler = require('./events/deleteTask');
const paginationHandler = require('./events/pagination');  // Adjust path if needed

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    // Handle button interactions for pagination and task operations
    await paginationHandler(client, interaction);

    // Handle task completion logic
    if (interaction.customId.startsWith('markDone')) {
      await completeTaskHandler.execute(interaction); // Call the delete function here
    }
    // Ensure the delete task handler is called correctly
    if (interaction.customId.startsWith('deleteTask')) {
      await deleteTaskHandler.execute(interaction);  // Call the delete function here
    }
  } else if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("❌ Error executing command:", error);
      await interaction.reply({ content: "Something went wrong.", ephemeral: true });
    }
  }
});

// Command handling
client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, "slashes")).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slashes/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
