import fs from 'node:fs'
import path from 'node:path'
import minimist from 'minimist'
import { usage, main, getVersion } from '../src/cli'
import { cloak } from '../src/index'

jest.mock('minimist')

jest.mock('../src/index', () => ({
  cloak: jest.fn()
}))

// eslint-disable-next-line
jest.mock('../src/cli', () => ({
  ...jest.requireActual('../src/cli'),
  getVersion: jest.fn(),
  parseArguments: jest.fn(),
}))

jest.mock('node:fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}))

jest.mock('node:path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
}))

describe('cli', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should display help message when no options provided', async () => {
    (minimist as jest.MockedFn<typeof minimist>).mockReturnValue({ _: [] })
    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith(usage)
  })

  test('should display version message when version flag provided', async () => {
    const version = '{ "version": "1.0.0" }';

    (minimist as jest.MockedFn<typeof minimist>).mockReturnValue({ _: [], version: true });
    (getVersion as jest.MockedFn<typeof getVersion>).mockResolvedValue(version);
    (fs.promises.readFile as jest.MockedFn<typeof fs.promises.readFile>).mockResolvedValue(version)

    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith((JSON.parse(version) as { version: string }).version)
  })

  test('should throw an error if called with unsupported arguments', async () => {
    (minimist as jest.MockedFn<typeof minimist>).mockReturnValue({ _: [], testArg: 'testVal' });

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

    (minimist as jest.MockedFn<typeof minimist>).mockReturnValue({ _: [], file, i: true });
    (cloak as jest.MockedFn<typeof cloak>).mockReturnValue(value);
    (path.resolve as jest.MockedFn<typeof path.resolve>).mockReturnValue(file);
    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

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

    (minimist as jest.MockedFn<typeof minimist>).mockReturnValue({ _: [], file });
    (cloak as jest.MockedFn<typeof cloak>).mockReturnValue(value);
    (path.resolve as jest.MockedFn<typeof path.resolve>).mockReturnValue(file);
    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    await main()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    await new Promise(process.nextTick)

    expect(cloak).toBeCalled()
    expect(fs.promises.writeFile).not.toBeCalled()
    expect(processStdoutWriteSpy).toHaveBeenCalledWith(JSON.stringify(value, null, 2))
  })
})
