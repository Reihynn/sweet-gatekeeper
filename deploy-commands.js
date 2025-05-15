const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'slashes')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./slashes/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// List of guild IDs where you want to deploy commands
const guildIds = [
  '613302376123727899',
  '548864090915995648',
  // add more guild IDs as needed
];

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );
      console.log(`Successfully reloaded commands for guild ${guildId}`);
    }

    console.log('All commands reloaded for specified guilds.');
  } catch (error) {
    console.error(error);
  }
})();
