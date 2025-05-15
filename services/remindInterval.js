const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getUsersToNotify() {
  const spreadsheetId = process.env.SHEET_ID;
  const sheetName = 'Users';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B1:C`,
  });

  const rows = res.data.values || [];

  // Filter rows where col C === 'TRUE' (case-insensitive)
  return rows
    .filter(row => row[1]?.toUpperCase() === 'TRUE')
    .map(row => row[0]); // Return user IDs from column B
}

async function getMessages() {
  const spreadsheetId = process.env.SHEET_ID;
  const sheetName = 'Messages';  // Change if your sheet name is different

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];

  // Return trimmed messages, ignoring empty rows
  return rows
    .map(row => row[0]?.trim())
    .filter(msg => msg && msg.length > 0);
}

module.exports = function startReminder(client, channelId, testMode = false) {
  const sendReminder = async () => {
    try {
      const usersToNotify = await getUsersToNotify();
      if (usersToNotify.length === 0) {
        console.log('No users to notify today.');
        return;
      }

      const mentions = usersToNotify.map(id => `<@${id}>`).join(' ');

      const messages = await getMessages();
      const finalMessages = messages.length > 0 
        ? messages 
        : ["Here is your daily reminder!"]; // fallback message

      const randomMessage = finalMessages[Math.floor(Math.random() * finalMessages.length)];

      const channel = await client.channels.fetch(channelId);
      if (!channel) return console.error('Channel not found!');

      await channel.send(`${mentions} ${randomMessage}`);
      console.log('Sent daily reminder mentioning:', usersToNotify);
    } catch (error) {
      console.error('Error sending daily reminder:', error);
    }
  };

  if (testMode) {
    // TEST MODE: send every 10 seconds
    sendReminder();
    setInterval(sendReminder, 10 * 1000);
  } else {
    // REAL MODE: send at next 00:00 UTC, then every 24h
    const now = new Date();
    const nextUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const delay = nextUTC - now;

    setTimeout(() => {
      sendReminder();
      setInterval(sendReminder, 24 * 60 * 60 * 1000);
    }, delay);
  }
};
