const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load all commands from /slashes
const commandFiles = fs.readdirSync(path.join(__dirname, "slashes")).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slashes/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("❌ Error executing command:", error);
    await interaction.reply({ content: "Something went wrong.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);