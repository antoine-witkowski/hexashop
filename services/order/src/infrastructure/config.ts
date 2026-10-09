import { z } from "zod";

const configSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);

  if (!result.success) {
    throw new Error("Invalid config:\n" + z.prettifyError(result.error));
  }

  return result.data;
}
