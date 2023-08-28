import fs from 'node:fs'
import path from 'node:path'
import minimist, { ParsedArgs } from 'minimist'
import { globSync } from 'glob'
import { cloak } from '.'

interface Args {
  shouldDisplayHelp: boolean
  shouldDisplayVersion: boolean
  shouldDisplayKeys: boolean
  shouldReplaceFile: boolean
  quiet: boolean
}

const supportedOptions = [
  'f',
  'file',
  'i',
  'in-place',
  'k',
  'keys',
  'p',
  'pattern',
  'q',
  'quiet',
  'v',
  'version',
  'h',
  'help'
]

export const usage = `
Replace UUIDs in your JSON files

Usage:
  json-cloak [options]

Options:
  -f, --file        Specify JSON file to transform. Passing multiple files will perform updates **in place**!
  -i, --in-place    Update file in place with transformed JSON object.
  -k, --keys        Display replaced keys instead of printing transformed JSON object
  -p, --pattern     Specify a glob pattern to operate on multiple files. This will perform updates **in place**!
  -q, --quiet       Don't print to stdout
  -v, --version     Display the version number
  -h, --help        Show this help

`
/**
 * The main function that runs the CLI tool.
 * Parses command-line arguments, displays help/version info, and invokes the transformation process.
 * @returns {Promise<void>}
 */
export async function main(): Promise<void> {
  const rawArgs = parseArguments()

  const args = validateArguments(rawArgs)

  // Display usage
  if (args.shouldDisplayHelp) {
    process.stdout.write(usage)
    return
  }

  // Display version
  if (args.shouldDisplayVersion) {
    const version = await getVersion()
    process.stdout.write(version)
    return
  }

  const files = resolveFileList(rawArgs)

  if (files.length ===  1) {
    void transformJSON({
      file: files[0],
      shouldReplaceFile: args.shouldReplaceFile,
      shouldDisplayKeys: args.shouldDisplayKeys,
      quiet: args.quiet
    })

    return
  }

  for (const file of files) {
    process.stdout.write(`Transforming file ${file}...\n`)
    void transformJSON({
      file,
      shouldReplaceFile: true,
      shouldDisplayKeys: false,
      quiet: true
    })
  }
}

/**
 * Parses command-line arguments using `minimist`.
 * @returns {Args} The parsed command-line arguments.
 */
export function parseArguments(): ParsedArgs {
  const args = minimist(process.argv.slice(2))

  // Check for unsupported options
  const unsupportedOptions = Object.keys(args).filter((option) => !supportedOptions.includes(option) && option !== '_')

  if (unsupportedOptions.length > 0) {
    const errorMessage = `Error: Unsupported arguments: ${unsupportedOptions.join(', ')}`
    throw new Error(errorMessage)
  }

  return args
}

/**
 * Validates that there are no incompatible argument combinations.
 * @returns {Args} The validated arguments.
 */
export function validateArguments(parsedArgs: ParsedArgs): Args {
  const args: Args = {
    shouldDisplayHelp    : Boolean(Object.keys(parsedArgs).length === 1 || parsedArgs.h || parsedArgs.help),
    shouldDisplayVersion : Boolean(parsedArgs.v || parsedArgs.version),
    shouldDisplayKeys    : Boolean(parsedArgs.k || parsedArgs.keys),
    shouldReplaceFile    : Boolean(parsedArgs.i || parsedArgs['in-place']),
    quiet                : Boolean(parsedArgs.q || parsedArgs.quiet)
  }

  if (args.shouldDisplayHelp || args.shouldDisplayVersion) {
    return args
  }

  if (args.shouldDisplayKeys) {
    // -k, --keys is incompatible with updating file in place
    if (args.shouldReplaceFile) {
      throw new Error('The provided options will overwrite file with replaced keys. Aborting operation.')
    }

    // -k, --keys is incompatible with operating on multiple files
    const globPattern = Boolean(parsedArgs.p || parsedArgs.pattern)
    if (globPattern) {
      throw new Error('Glob pattern option is incompatible with key display option. Aborting operation.')
    }

    // -k, --keys is incompatible with operating on multiple files
    const file = (parsedArgs.f || parsedArgs.file) as string | string[]
    if (Array.isArray(file)) {
      throw new Error('Keys can only be displayed for a single file at a time')
    }
  }

  return args
}

/**
 * Valid files and glob patterns can either be strings or arrays of strings.
 * For `cloak` to work, at least one of `-f` or `-p` should be a valid type.
 */
const isValidFileReference = (arg: unknown): boolean => typeof arg === 'string' || (Array.isArray(arg) && arg.every(item => typeof item === 'string'))

/**
 * Get list of all files to transform from either one or more individual file arguments,
 * one or more glob patterns, or both
 *
 * @param {Object} rawArgs - Object containing arguments passed to the script, gently massaged by minimist
 */ 
export function resolveFileList(rawArgs: ParsedArgs): string[] {
  const files: unknown = rawArgs.f || rawArgs.file
  const globs: unknown = rawArgs.p || rawArgs.pattern

  let fileList: string[] = []

  if (!isValidFileReference(files) && !isValidFileReference(globs)) {
    throw new Error('At least one of `-f, --file` or `-p, --pattern` must be provided.')
  }

  if (isValidFileReference(files)) {
    // get individual file args
    fileList = fileList.concat(files as string | string[])
  }

  if (isValidFileReference(globs)) {
    // get files from glob patterns
    for (const pattern of ([] as string[]).concat(globs as string | string[])) {
      const resolvedFiles: string[] = globSync(pattern, { cwd: process.cwd(), ignore: 'node_modules/**' }) // eslint-disable-line
      fileList.push(...resolvedFiles)
    }
  }

  return Array.from(new Set(fileList))
}

/**
 * Retrieves the version number from `package.json`
 * @returns {Promise<string>} The version number.
 */
export async function getVersion(): Promise<string> {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json')
    const content = await getFileContents(pkgPath)
    return (JSON.parse(content) as { version: string }).version
  } catch (err: unknown) {
    const errorMessage = `Error retrieving package version: ${(err as Error).message}`
    throw new Error(errorMessage)
  }
}

/**
 * Transforms the JSON file content by replacing UUIDs with new IDs.
 * @param {string} args.file - The path to the JSON file to transform.
 * @param {boolean} args.shouldReplaceFile - Indicates if the file should be updated in place.
 * @param {boolean} args.shouldDisplayKeys - Indicates if only the replaced keys should be displayed.
 * @param {boolean} args.quiet - If present, don't print to stdout.
 * @returns {Promise<void>} A Promise that resolves when the transformation is complete.
 */
export async function transformJSON({
  file,
  shouldReplaceFile,
  shouldDisplayKeys,
  quiet,
}: {
  file: string
  shouldReplaceFile: boolean
  shouldDisplayKeys: boolean
  quiet: boolean
}): Promise<void> {
  try {
    const content = await getFileContents(file)
    const transformedContent = JSON.stringify(cloak(content, { keys: shouldDisplayKeys }), null, 2)

    if (shouldReplaceFile) {
      void fs.promises.writeFile(path.resolve(process.cwd(), file), transformedContent)
    }

    if (quiet) {
      return
    }

    process.stdout.write(transformedContent)
  } catch (err: unknown) {
    const errorMessage = `Error retrieving package version: ${(err as Error).message}`
    throw new Error(errorMessage)
  }
}

/**
 * Reads the contents of the specified file.
 * @param {string} file - The path to the file to read.
 * @returns {Promise<string>} The contents of the file as a string.
 */
export async function getFileContents(file: string): Promise<string> {
  const filePath = path.resolve(process.cwd(), file)
  return await fs.promises.readFile(filePath, 'utf-8')
}
