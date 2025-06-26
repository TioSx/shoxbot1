const AdminZip = require("adm-zip");

module.exports = async (folderName, zipName) => {
	const zip = new AdminZip();

	await zip
		.addLocalFolderPromise(`./attachments/${folderName}`)
		.catch(() => null);

	await zip.writeZipPromise(`./attachments/${zipName}.zip`).catch(() => null);
};
