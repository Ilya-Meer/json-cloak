import minimist from "./__mocks__/minimist";
import {  main, parseArguments  } from '../src/cli'

describe("cli", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test("should display help message when no options provided", async () => {
    // Mock the minimist function
    minimist.mockReturnValue({
      _: [],
    });

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
});

describe("parseArguments", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should parse valid arguments', () => {
      // Mock the minimist function
      minimist.mockReturnValue({
        _: [],
        v: true,
        h: false,
      });

      const args = parseArguments();

      expect(minimist).toHaveBeenCalled();
      expect(args).toEqual({ _: [], v: true, h: false });
    });
});
