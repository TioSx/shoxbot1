const { default: axios } = require("axios");

module.exports = () => {
  const status = ["🔴 Offline", "🟢 Online"];
  const iconURLs = [
    "https://cdn.discordapp.com/icons/1099040187251699785/a_a68b11eb9e001c46846b7364fd04a842.gif?size=512",
    "https://cdn.discordapp.com/icons/1102616719123558402/a_ca6eac57ab6cc8bc5c4bf33705662798.gif?size=512",
    "https://cdn.discordapp.com/icons/1108183376118153307/a_1bd1a85e1b679f51f114c139cca00dd4.gif?size=512",
    "https://cdn.discordapp.com/icons/1108184382298128475/a_38342dcda9ec0d7d0ec53f4cf24c949a.gif?size=512",
  ];
  const inviteLinks = [
    "https://discord.gg/bps1",
    "https://discord.gg/bps2",
    "https://discord.gg/zf3JcDa4FH",
    "https://discord.gg/pKxbhavBWX",
  ];

  return Promise.allSettled([
    axios.get("https://server.eaglevision.group/v1/list/sx-1"),
    axios.get("https://server.eaglevision.group/v1/list/sx-2"),
    axios.get("https://server.eaglevision.group/v1/list/sx-3"),
    axios.get("https://server.eaglevision.group/v1/list/sx-4"),
  ]).then((values) => {
    const servers = values.map((v) => {
      if (v.status === "rejected") {
        console.log(`ServerTrackerError: ${v.reason}`);
        return null;
      } else {
        return v.value.data;
      }
    });

    return servers.map((s, i) =>
      s
        ? {
            ...s,
            description: `🌎 **Servidor:** ${s.hostname}\n📌 **Status:** ${
              status[s.online] ?? status[0]
            } ${
              s.password == "1" ? "**com senha** 🔒" : ""
            }\n🎮 **Jogadores:** ${s.players}/${s.max_players}\n🏷 **IP:** ${
              s.ip
            }:${s.port}\n\n⌛ Atualizado <t:${Math.round(Date.now() / 1e3)}:R>`,
            iconURL: iconURLs[i],
            inviteLink: inviteLinks[i],
            playLink: "https://brasilplayshox.com.br/downloads",
            forumLink: s.url_forum,
          }
        : null
    );
  });
};
