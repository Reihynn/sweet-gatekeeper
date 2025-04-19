const { google } = require('googleapis');
const fs = require('fs');

// Authenticate using the credentials file
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

async function testSheetRead() {
  const spreadsheetId = '1Lad6LgQVZQOuOARJRYR3R7l6uPwlROkdUWeuTbydiI0'; // from the Sheet URL
  const range = 'Reminders!B5:C5'; // adjust to fit your sheet

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  console.log('Data from sheet:', response.data.values);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  testSheetRead(); // <-- Call test function
});

client.login(process.env.DISCORD_TOKEN);

