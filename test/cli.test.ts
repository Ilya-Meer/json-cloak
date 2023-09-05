import fs from 'node:fs'
import path from 'node:path'
import minimist from 'minimist'
import { describe, afterEach, test, expect, vi, MockedFunction } from 'vitest'
import { usage, main, getVersion } from '../src/cli'
import { cloak } from '../src/index'

vi.mock('minimist')

vi.mock('../src/index', () => ({
  cloak: vi.fn()
}))

vi.mock('../src/cli', async (importOriginal) => {
  const mod = await importOriginal()
  // eslint-disable-next-line
  return {
    // eslint-disable-next-line
    // @ts-ignore
    ...mod,
    getVersion: vi.fn(),
    parseArguments: vi.fn(),
  }
})

vi.mock('node:fs', () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    }
  },
}))

vi.mock('node:path', () => ({
  default: {
    join: vi.fn(),
    resolve: vi.fn(),
  },
}))

describe('cli', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should display help message when no options provided', async () => {
    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [] })
    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith(usage)
  })

  test('should display version message when version flag provided', async () => {
    const version = '{ "version": "1.0.0" }';

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], version: true });
    (getVersion as MockedFunction<typeof getVersion>).mockResolvedValue(version);
    (fs.promises.readFile as MockedFunction<typeof fs.promises.readFile>).mockResolvedValue(version)

    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith((JSON.parse(version) as { version: string }).version)
  })

  test('should throw an error if called with unsupported arguments', async () => {
    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], testArg: 'testVal' });

    const errorMessage = `Error: Unsupported arguments: testArg`

    try {
      await main()
    } catch(err) {
      expect((err as Error).message).toEqual(errorMessage)
    }
  })

  test('should replace file contents when called with -i option', async () => {
    const file = 'test.json'
    const value = { foo: 42 };

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], file, i: true });
    (cloak as MockedFunction<typeof cloak>).mockReturnValue(value);
    (path.resolve as MockedFunction<typeof path.resolve>).mockReturnValue(file);
    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    expect(cloak).toBeCalled()
    expect(fs.promises.writeFile).toBeCalledWith(file, JSON.stringify(value, null, 2))
    expect(processStdoutWriteSpy).toHaveBeenCalledWith(JSON.stringify(value, null, 2))
  })

  test('should not replace file contents when not called with -i option', async () => {
    const file = 'test.json'
    const value = { foo: 42 };

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], file });
    (cloak as MockedFunction<typeof cloak>).mockReturnValue(value);
    (path.resolve as MockedFunction<typeof path.resolve>).mockReturnValue(file);
    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    expect(cloak).toBeCalled()
    expect(fs.promises.writeFile).not.toBeCalled()
    expect(processStdoutWriteSpy).toHaveBeenCalledWith(JSON.stringify(value, null, 2))
  })

  test('should not write to stdout if `quiet` flag passed', async () => {
    const file = 'test.json'
    const value = { foo: 42 };

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], file, quiet: true });
    (cloak as MockedFunction<typeof cloak>).mockReturnValue(value);
    (path.resolve as MockedFunction<typeof path.resolve>).mockReturnValue(file);
    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    expect(cloak).toBeCalled()
    expect(fs.promises.writeFile).not.toBeCalled()
    expect(processStdoutWriteSpy).not.toBeCalled()
  })

  test('should handle multiple files passed separately', async () => {
    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], i: true, file: ['test.json', 'foo.json']  });

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    // test.json, foo.json
    expect(fs.promises.writeFile).toBeCalledTimes(2)
  })

  test('should resolve glob patterns', async () => {
    const pattern = 'test/*.json';

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], pattern  });

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    // test.json, foo.json
    expect(fs.promises.writeFile).toBeCalledTimes(2)
  })

  test('should only write transformed file names to stdout if multiple files passed', async () => {
    const pattern = 'test/*.json';

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], pattern  });
    const processStdoutWriteSpy = vi.spyOn(process.stdout, 'write')

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    expect(fs.promises.writeFile).toBeCalledTimes(2)

    expect(processStdoutWriteSpy).toBeCalledTimes(2)
    expect(processStdoutWriteSpy.mock.calls).toEqual([
      ["Transforming file test/test.json...\n"],
      ["Transforming file test/foo.json...\n"]
    ])
  })

  test('should forbid using -k flag along with glob pattern', async () => {
    const pattern = 'test/*.json';

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], pattern, k: true  });

    const errorMessage = `Error: Glob pattern option is incompatible with key display option. Aborting operation.`

    try {
      await main()
    } catch(err) {
      expect((err as Error).message).toEqual(errorMessage)
    }
  })

  test('should deduplicate files', async () => {
    const pattern = 'test/*.json';
    const file = 'test/test.json';

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], pattern, file  });

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    // test.json, foo.json
    expect(fs.promises.writeFile).toBeCalledTimes(2)
  })

  test('should forbid using -k flag along with multiple files', async () => {
    const files = ['test.json', 'foo.json'];

    (minimist as MockedFunction<typeof minimist>).mockReturnValue({ _: [], file: files, k: true  });

    const errorMessage = `Error: Keys can only be displayed for a single file at a time. Aborting operation.`

    try {
      await main()
    } catch(err) {
      expect((err as Error).message).toEqual(errorMessage)
    }
  })
})
