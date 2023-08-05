import minimist from 'minimist'
// import { usage, main, getVersion, parseArguments, transformJSON } from '../src/cli'
import { usage, main, getVersion } from '../src/cli'

jest.mock('minimist')

// eslint-disable-next-line
jest.mock('../src/cli', () => ({
  ...jest.requireActual('../src/cli'),
  getVersion: jest.fn(),
  parseArguments: jest.fn(),
  transformJSON: jest.fn()
}))

jest.mock('node:fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('node:path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
}));

describe('cli', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should display help message when no options provided', async () => {
    // eslint-disable-next-line
    (minimist as any).mockReturnValue({ _: [] })

    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith(usage)
  })

  test('should display version message when version flag provided', async () => {
    const version = "1.0.0";

    // eslint-disable-next-line
    (minimist as any).mockReturnValue({ _: [], version: true });

    // eslint-disable-next-line
    (getVersion as jest.MockedFn<any>).mockResolvedValue(version)

    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith(version)
  })

  // test('should call `transformJSON with the correct arguments', async () => {
  //   const file = 'test.json';

  //   // eslint-disable-next-line
  //   (minimist as any).mockReturnValue({ _: [], file, i: true })

  //   await main()

  //   expect(parseArguments).toHaveBeenCalled()

  //   // Check if transformJSON is called with the correct arguments
  //   expect(transformJSON).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       file,
  //       shouldReplaceFile: true,
  //     })
  //   )
  // })
})
