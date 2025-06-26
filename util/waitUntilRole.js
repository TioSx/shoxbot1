/**
 * Aguarda até que o cargo desejado esteja presente ou ausente no member.roles.cache
 * @param {GuildMember} member
 * @param {string} roleId
 * @param {boolean} present - true = esperar o cargo aparecer, false = esperar o cargo sumir
 * @param {number} timeoutMs - timeout total em ms
 * @param {number} intervalMs - intervalo entre checagens
 * @returns {Promise<boolean>} - true = condição alcançada, false = timeout
 */
async function waitUntilRole(member, roleId, present = true, timeoutMs = 5000, intervalMs = 500) {
  const maxTries = Math.ceil(timeoutMs / intervalMs);
  let tries = 0;

  while (tries < maxTries) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    await member.fetch();

    const hasRole = member.roles.cache.has(roleId);

    if ((present && hasRole) || (!present && !hasRole)) {
      return true;
    }

    tries++;
  }

  return false; // timeout
}

module.exports = waitUntilRole;
