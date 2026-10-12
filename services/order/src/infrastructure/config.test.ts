import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const DATABASE_URL = "postgres://hexashop:hexashop@localhost:5432/order_db";
const NATS_URL = "nats://localhost:4222";

describe("loadConfig", () => {
  it("reads a valid configuration", () => {
    const config = loadConfig({ DATABASE_URL, PORT: "4000", NATS_URL });

    expect(config).toEqual({ DATABASE_URL, PORT: 4000, NATS_URL });
  });

  it("defaults PORT to 3000", () => {
    expect(loadConfig({ DATABASE_URL, NATS_URL }).PORT).toBe(3000);
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => loadConfig({ NATS_URL })).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-Postgres URL", () => {
    expect(() => loadConfig({ DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejets a missing NATS_URL", () => {
    expect(() => loadConfig({ DATABASE_URL: DATABASE_URL })).toThrow(
      /NATS_URL/,
    );
  });
});
