#!/usr/bin/env node
// Quick diagnostic script to check MPRIS players
const dbus = require('dbus-next');

async function checkPlayers() {
  try {
    const bus = dbus.sessionBus();
    const obj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
    const dbusInterface = obj.getInterface('org.freedesktop.DBus');

    const names = await dbusInterface.ListNames();
    const mediaPlayers = names.filter(name => name.startsWith('org.mpris.MediaPlayer2.'));

    console.log('=== MPRIS Media Players Found ===');
    if (mediaPlayers.length === 0) {
      console.log('No media players detected!');
      console.log('\nMake sure Spotify is running and playing music.');
      console.log('You can verify with: dbus-send --print-reply --dest=org.freedesktop.DBus /org/freedesktop/DBus org.freedesktop.DBus.ListNames | grep mpris');
    } else {
      mediaPlayers.forEach((name, i) => {
        console.log(`${i + 1}. ${name}`);
      });

      // Try to get metadata from first player
      const playerName = mediaPlayers[0];
      console.log(`\n=== Testing ${playerName} ===`);

      const player = await bus.getProxyObject(playerName, '/org/mpris/MediaPlayer2');
      const propsInterface = player.getInterface('org.freedesktop.DBus.Properties');

      // Use Properties.Get instead of direct access
      const metadataVariant = await propsInterface.Get('org.mpris.MediaPlayer2.Player', 'Metadata');
      const statusVariant = await propsInterface.Get('org.mpris.MediaPlayer2.Player', 'PlaybackStatus');

      const metadata = metadataVariant.value;
      const status = statusVariant.value;

      console.log('Playback Status:', status);
      console.log('Metadata keys:', metadata ? Object.keys(metadata) : 'none');

      if (metadata) {
        const getVal = (key) => {
          const val = metadata[key];
          return val?.value !== undefined ? val.value : val;
        };

        console.log('\nTrack Info:');
        console.log('  Title:', getVal('xesam:title'));
        console.log('  Artist:', getVal('xesam:artist'));
        console.log('  Album:', getVal('xesam:album'));
        console.log('  Art URL:', getVal('mpris:artUrl'));
      } else {
        console.log('\nNo metadata available - is music playing?');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPlayers();
