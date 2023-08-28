import path = require("path");
import * as fs from "fs";

export const check_version = async () => {};

export function courseDirectory(label: string): string {
	const match = label.match(/^([A-Za-z]+[- ]*\d+\w*)\b/);
	return match ? match[1] : label;
}

export function from_slash(name: string) {
	const parts = name.split("/");
	return path.join(...parts);
}

export function decode64(data: string) {
	return Buffer.from(data, "base64");
}

export function encode64(data: Buffer) {
	return data.toString("base64");
}

export function updateFiles(
	directory: string,
	files: Record<string, Buffer>,
	oldFiles: Record<string, boolean>
): void {
	for (const [name, contents] of Object.entries(files)) {
		const filePath = path.join(directory, name);
		if (fs.existsSync(filePath)) {
			const onDisk = fs.readFileSync(filePath);

			if (!onDisk.equals(contents)) {
				fs.writeFileSync(filePath, contents);
			}
		} else {
			fs.mkdirSync(path.dirname(filePath), {
				mode: 0o755,
				recursive: true,
			});
			fs.writeFileSync(filePath, contents);
		}
	}

	for (const name of Object.keys(oldFiles)) {
		if (files.hasOwnProperty(name)) {
			continue;
		}

		const filePath = path.join(directory, name);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		const dirPath = path.dirname(name);

		if (dirPath !== "") {
			try {
				fs.rmdirSync(path.join(directory, dirPath));
			} catch (error) {
				// Ignore errors--the directory may not be empty
			}
		}
	}
}
