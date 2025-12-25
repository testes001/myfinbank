import { jest } from "@jest/globals";

// Prevent external HTTP calls during tests
const mockFetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({}),
  text: async () => "",
})) as unknown as typeof fetch;

global.fetch = mockFetch;

afterEach(() => {
  jest.clearAllMocks();
});
