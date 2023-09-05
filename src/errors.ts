export enum errors {
  UNSUPPORTED_ARGS_ERROR = 'Error: Unsupported arguments: ',
  KEY_OVERWRITE_ERROR = 'Error: The provided options will overwrite file with replaced keys. Aborting operation.',
  KEY_GLOB_CONFLICT_ERROR = 'Error: Glob pattern option is incompatible with key display option. Aborting operation.',
  KEY_MULTIPLE_FILE_ERROR = 'Error: Keys can only be displayed for a single file at a time. Aborting operation.',
  MISSING_FILE_ARG_ERROR = 'Error: At least one of `-f, --file` or `-p, --pattern` must be provided.',
  PACKAGE_VERSION_ERROR = 'Error: Error retrieving package version: ',
  TRANSFORM_ERROR = 'Error: Error tranforming JSON: '
}

export const formatError = (err: errors, ...messages: string[]): string => err.concat(...messages || '')
