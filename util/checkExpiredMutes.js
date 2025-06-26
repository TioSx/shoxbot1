const Block = require(`${process.cwd()}/database/models/block.js`);

async function checkExpiredMutes(client) {
  const now = Date.now();

  const expiredMutes = await Block.find({ expiresAt: { $lt: now } });

  for (const mute of expiredMutes) {
    const guild = client.guilds.cache.get(mute.guildId);
    if (!guild) continue;

    const member = await guild.members.fetch(mute.userId).catch(() => null);
    if (member) {
      await member.roles.remove(mute.roleId);
    }

    await Block.deleteOne({ _id: mute._id });
  }
}

module.exports = checkExpiredMutes;
