import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const DATABASE_URL = "postgres://hexashop:hexashop@localhost:5432/order_db";

describe("loadConfig", () => {
  it("reads a valid configuration", () => {
    const config = loadConfig({ DATABASE_URL, PORT: "4000" });

    expect(config).toEqual({ DATABASE_URL, PORT: 4000 });
  });

  it("defaults PORT to 3000", () => {
    expect(loadConfig({ DATABASE_URL }).PORT).toBe(3000);
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-Postgres URL", () => {
    expect(() => loadConfig({ DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /DATABASE_URL/,
    );
  });
});
