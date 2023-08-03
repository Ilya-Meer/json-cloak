import { v4 as uuid } from 'uuid'

/**
 * Represents value to parse and transform
 */
type JsonLike = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonLike }
type JsonArray = JsonLike[]

/**
 * Represents a mapping of original UUIDs to new IDs and their paths.
 */
type IdMap = Record<string, { newId: string, paths: string[] }>

/**
 * Configuration options for the cloak function.
 */
interface CloakOptions {
  /**
   * If true, only the replaced keys are returned instead of the entire transformed JSON object.
   */
  keys: boolean
}

/**
 * Regular expression to validate UUID format.
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * Entrypoint. Replaces UUIDs in the JsonLike value with new IDs.
 *
 * @param {JsonLike} value - The value to be transformed.
 * @param {CloakOptions} [options] - Optional configuration options for the transformation.
 * @returns {JsonLike} The transformed value.
 * @throws {Error} If JSON parsing fails or invalid input is provided.
 */
export function cloak(value: JsonLike, options?: CloakOptions): JsonLike {
  try {
    const idMap: IdMap = {}
    const jsonValue = validate(value)

    if (options) {
      if (options.keys) {
        replaceIds(jsonValue, idMap, '')
        return getKeysFromIdMap(idMap)
      }
    }

    return replaceIds(jsonValue, idMap, '')
  } catch (err: unknown) {
    throw new Error(`JSON parsing failed: ${(err as Error).message}`)
  }
}

/**
 * Recursively replaces UUIDs with new IDs in the JsonLike value.
 *
 * @param {JsonLike} value - The value to be transformed.
 * @param {IdMap} idMap - The mapping of original UUIDs to new IDs and their paths.
 * @param {string} path - The current path within the JSON structure.
 * @returns {JsonLike} The transformed value.
 */
function replaceIds(value: JsonLike, idMap: IdMap, path: string): JsonLike {
  if (typeof value === 'string') {
    if (uuidRegex.test(value)) {
      const replacement = idMap[value]
      if (replacement) {
        idMap[value].paths.push(path)
        return replacement.newId
      }

      const newId = uuid()
      idMap[value] = { newId, paths: [path] }

      return newId
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => replaceIds(item, idMap, `${path}[${idx}]`))
  }

  if (typeof value === 'object' && value !== null) {
    const newValue: JsonObject = {}

    for (const key in value) {
      newValue[key] = replaceIds(value[key], idMap, `${path}.${key}`)
    }

    return newValue
  }

  return value
}

/**
 * Validates the value and returns the parsed JSON value.
 *
 * @param {JsonLike} value - The JsonLike value to be validated and parsed.
 * @returns {JsonLike} The parsed JSON value.
 * @throws {Error} If undefined, empty string, or invalid JSON is provided.
 */
function validate(value: JsonLike): JsonLike {
  if (typeof value === 'undefined') {
    throw new Error('undefined is not valid JSON')
  }

  if (value === '') {
    throw new Error(`'' is not valid JSON`)
  }

  const jsonValue = typeof value === 'string' ? JSON.parse(value) as JsonLike : value

  return jsonValue
}

/**
 * Extracts all replaced keys from the IdMap and returns them as an array of strings.
 *
 * @param {IdMap} idMap - The mapping of original UUIDs to new IDs and their paths.
 * @returns {string[]} The array of all replaced keys.
 */
function getKeysFromIdMap(idMap: IdMap): string[] {
  return Object.values(idMap).reduce((acc, value) => acc.concat(value.paths), [] as string[])
}

