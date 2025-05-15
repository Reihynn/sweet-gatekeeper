const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const clientId = process.env.CLIENT_ID;
// Add all guild IDs where you want to delete guild commands:
const guildIds = [
  '613302376123727899',
  '548864090915995648',
  // add more if needed
];

(async () => {
  try {
    // Delete all global commands
    console.log('Deleting all global commands...');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] } // empty array deletes all global commands
    );
    console.log('Successfully deleted all global commands.');

    // Delete all guild commands for each guild
    for (const guildId of guildIds) {
      console.log(`Deleting all commands in guild ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: [] } // empty array deletes all guild commands in that guild
      );
      console.log(`Successfully deleted all guild commands in ${guildId}.`);
    }

    console.log('Done deleting all commands.');
  } catch (error) {
    console.error('Error deleting commands:', error);
  }
})();
