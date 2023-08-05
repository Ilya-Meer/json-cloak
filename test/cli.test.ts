import minimist from './__mocks__/minimist';
import {  main, parseArguments  } from '../src/cli'

// To avoid any hoisting problems with the test, we can first import the module, then mock the module, and with different tests, we can then mock the module with different values.

jest.mock("minimist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("cli", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should display help message when no options provided", async () => {
    const processStdoutWriteSpy = jest.spyOn(process.stdout, "write");
    // Call the main function with no arguments
    await main();

    // Expect the mocked minimist function to have been called
    expect(minimist).toHaveBeenCalled();

    // Expect that the help message is displayed
    expect(processStdoutWriteSpy).toHaveBeenCalledWith(
      expect.stringContaining("Replace UUIDs in your JSON files")
    );
  });

  test("should parse valid arguments", () => {
    const args = parseArguments();

    expect(minimist).toHaveBeenCalled();
    expect(args).toEqual({ _: [], v: true, h: false });
  });
});
