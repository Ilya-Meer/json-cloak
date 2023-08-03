import { cloak } from '../src'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('json-cloak', () => {
  test('handles JSON objects or strings', () => {
    const testObj = {
      "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      "nested": {
        "id": "f8df7183-93b4-42f0-8ebd-85afada4a0b5",
      }
    }

    expect(() => cloak(testObj)).not.toThrowError()

    const testStr = JSON.stringify(testObj)
    expect(() => cloak(testStr)).not.toThrowError()

    const result = cloak(testStr)
    expect(typeof result === 'object').toBe(true)
  })

  test('throws appropriate error when given invalid type', () => {
    // @ts-expect-error `cloak` only accepts objects or JSON strings
    expect(() => cloak(undefined)).toThrowError()

    expect(() => cloak('')).toThrowError()
  })

  test('replaces uuids in nested json objects', () => {
    const testObj = {
      "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      "nested": {
        "id": "f8df7183-93b4-42f0-8ebd-85afada4a0b5",
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

    const id = testObj.id 
    const nestedId = testObj.nested.id 

    expect(uuidRegex.test(id)).toBe(true)
    expect(uuidRegex.test(nestedId)).toBe(true)

    const result = cloak(testObj) as typeof testObj

    const resultId  = result.id
    const resultNestedId  = result.id

    expect(uuidRegex.test(resultId)).toBe(true)
    expect(uuidRegex.test(resultNestedId)).toBe(true)

    expect(id).not.toEqual(resultId)
    expect(nestedId).not.toEqual(resultNestedId)
  })

  test('replaces identical ids with the same id', () => {
    const testObj = {
      "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      "nested": {
        "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      }
    }

    const id = testObj.id 
    const nestedId = testObj.nested.id 

    expect(uuidRegex.test(id)).toBe(true)
    expect(uuidRegex.test(nestedId)).toBe(true)

    const result = cloak(testObj) as typeof testObj

    const resultId  = result.id
    const resultNestedId  = result.id

    expect(uuidRegex.test(resultId)).toBe(true)
    expect(uuidRegex.test(resultNestedId)).toBe(true)

    expect(id).not.toEqual(resultId)
    expect(resultId).toEqual(resultNestedId)
  })

  test('displays list of replaced keys when keys option enabled', () => {
    const testObj = {
      "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      "nested": {
        "id": "d7cf7183-93b4-42f0-8ebd-85afada4a0b5",
      }
    }

    const result = cloak(testObj, { keys: true })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(['.id', '.nested.id'])
  })
})

