import { jest } from "@jest/globals";

declare global {
  // eslint-disable-next-line no-var
  var fetch: any;
}

// Prevent external HTTP calls during tests
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
  text: async () => "",
});

globalThis.fetch = mockFetch;

afterEach(() => {
  jest.clearAllMocks();
});
