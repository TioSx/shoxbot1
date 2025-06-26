module.exports = (str, len, char = " ") => {
	let parts = str.split("\n"),
		max = Math.max(...parts.map(({ length }) => length));

	return parts
		.map((s) =>
			s
				.padStart(s.length + Math.floor((len - s.length) / 2), char)
				.padEnd(len, char)
		)
		.join("\n");
};
