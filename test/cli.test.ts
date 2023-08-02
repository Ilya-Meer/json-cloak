import { usage, main } from '../src/cli'


// eslint-disable-next-line
jest.mock('../src/cli', () => ({
  ...jest.requireActual('../src/cli'),
  getVersion: jest.fn()
}))

jest.mock('minimist', () => jest.fn().mockReturnValue({ _: [] }))

describe('cli', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should display help message when no options provided', async () => {
    const processStdoutWriteSpy = jest.spyOn(process.stdout, 'write')

    // Call main with no options
    await main()

    expect(processStdoutWriteSpy).toHaveBeenCalledWith(usage)
  })
})
