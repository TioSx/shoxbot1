const axios = require("axios").default;
const fs = require("fs");

module.exports = async function downloadImage(url, filename) {
	try {
		const response = await axios.get(url, { responseType: "arraybuffer" });
		fs.writeFileSync(filename, response.data);
	} catch (_) {}
};
