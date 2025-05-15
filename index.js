const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const startReminder = require("./services/remindInterval");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create commands collection
client.commands = new Collection();

// Load commands before event handlers
const commandFiles = fs
  .readdirSync(path.join(__dirname, "slashes"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slashes/${file}`);
  client.commands.set(command.data.name, command);
  console.log(`Loaded command: ${command.data.name}`);
}

// Event handlers
const completeTaskHandler = require("./events/completeTask");
const deleteTaskHandler = require("./events/deleteTask");
const paginationHandler = require("./events/pagination");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    await paginationHandler(client, interaction);

    if (interaction.customId.startsWith("markDone")) {
      await completeTaskHandler.execute(interaction);
    }
    if (interaction.customId.startsWith("deleteTask")) {
      await deleteTaskHandler.execute(interaction);
    }
  } else if (interaction.isChatInputCommand()) {
    console.log(`Received command: ${interaction.commandName}`);

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.log(`Command ${interaction.commandName} not found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("❌ Error executing command:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
      }
    }
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.content.toLowerCase() === "weweweweoihwefohwe") {
    message.channel.send("a");
  }
});

// Start reminder service
startReminder(client, "615529702823821322", false);

client.login(process.env.DISCORD_TOKEN);
