import { jest } from "@jest/globals";

// Prevent external HTTP calls during tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
  text: async () => "",
}) as any;

afterEach(() => {
  jest.clearAllMocks();
});
