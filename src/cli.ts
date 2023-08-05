#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import minimist from "minimist";
import { cloak } from ".";

type Args = { [key: string]: string | boolean };

const supportedOptions = [
  "f",
  "file",
  "i",
  "in-place",
  "k",
  "keys",
  "v",
  "version",
  "h",
  "help",
];

export const usage = `
Replace UUIDs in your JSON files

Usage:
  json-cloak [options]

Options:
  -f, --file        Specify JSON file to transform
  -i, --in-place    Update file in place with transformed JSON object
  -k, --keys        Display replaced keys instead of printing transformed JSON object
  -v, --version     Display the version number
  -h, --help        Show this help

`;
/**
 * The main function that runs the CLI tool.
 * Parses command-line arguments, displays help/version info, and invokes the transformation process.
 * @returns {Promise<void>}
 */
export async function main(): Promise<void> {
  const args = parseArguments();

  // Display usage
  if (Object.keys(args).length === 1 || args.h || args.help) {
    process.stdout.write(usage);
    return;
  }

  // Display version
  if (args.v || args.version) {
    const version = await getVersion();
    process.stdout.write(version);
    return;
  }

  const shouldDisplayKeys = args.k || args.keys;
  const shouldReplaceFile = args.i || args["in-place"];
  const file = args.f || args.file;

  if (typeof file !== "string") {
    throw new Error(
      "The `-f, --file` option was either not used or no file argument was passed in."
    );
  }

  if (shouldDisplayKeys && shouldReplaceFile) {
    throw new Error(
      "The provided options will overwrite file with replaced keys. Aborting operation."
    );
  }

  void transformJSON({
    file,
    shouldReplaceFile: shouldReplaceFile as boolean,
    shouldDisplayKeys: shouldDisplayKeys as boolean,
  });
}

/**
 * Parses command-line arguments using `minimist`.
 * @returns {Args} The parsed command-line arguments.
 */
export function parseArguments(): Args {
  const args = minimist(process.argv.slice(2));

  // Check for unsupported options
  const unsupportedOptions = Object.keys(args).filter(
    (option) => !supportedOptions.includes(option) && option !== "_"
  );

  if (unsupportedOptions.length > 0) {
    const errorMessage = `Error: Unsupported arguments: ${unsupportedOptions.join(
      ", "
    )}`;
    throw new Error(errorMessage);
  }

  return args;
}

/**
 * Retrieves the version number from `package.json`
 * @returns {Promise<string>} The version number.
 */
export async function getVersion(): Promise<string> {
  try {
    const pkgPath = path.join(__dirname, "..", "package.json");
    const content = await getFileContents(pkgPath);
    return (JSON.parse(content) as { version: string }).version;
  } catch (err: unknown) {
    const errorMessage = `Error retrieving package version: ${
      (err as Error).message
    }`;
    throw new Error(errorMessage);
  }
}

/**
 * Transforms the JSON file content by replacing UUIDs with new IDs.
 * @param {string} args.file - The path to the JSON file to transform.
 * @param {boolean} args.shouldReplaceFile - Indicates if the file should be updated in place.
 * @param {boolean} args.shouldDisplayKeys - Indicates if only the replaced keys should be displayed.
 * @returns {Promise<void>} A Promise that resolves when the transformation is complete.
 */
export async function transformJSON({
  file,
  shouldReplaceFile,
  shouldDisplayKeys,
}: {
  file: string;
  shouldReplaceFile: boolean;
  shouldDisplayKeys: boolean;
}): Promise<void> {
  const content = await getFileContents(file);
  const transformedContent = JSON.stringify(
    cloak(content, { keys: shouldDisplayKeys }),
    null,
    2
  );

  if (shouldReplaceFile) {
    void fs.promises.writeFile(
      path.resolve(__dirname, file),
      transformedContent
    );
  }

  process.stdout.write(transformedContent);
}

/**
 * Reads the contents of the specified file.
 * @param {string} file - The path to the file to read.
 * @returns {Promise<string>} The contents of the file as a string.
 */
export async function getFileContents(file: string): Promise<string> {
  const filePath = path.resolve(__dirname, file);
  return await fs.promises.readFile(filePath, "utf-8");
}

// main()
//   .catch((err: Error) => {
//     process.stdout.write(err.message)
//     process.exit(1)
//   })
