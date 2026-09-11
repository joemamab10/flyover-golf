import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Single-golfer, single-process POC. Serialize mutations to avoid lost updates.
export function createStore(directory) {
  const file = join(directory, "golfer.json");
  let pending = Promise.resolve();
  async function read() {
    try { return JSON.parse(await readFile(file, "utf8")); }
    catch (error) {
      if (error.code === "ENOENT") return { profile: {}, rounds: [] };
      throw error;
    }
  }
  return {
    async read() { await pending; return read(); },
    update(change) {
      const operation = pending.then(async () => {
        const state = await read();
        const result = change(state);
        await mkdir(directory, { recursive: true });
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
        await rename(temporary, file);
        return result;
      });
      pending = operation.catch(() => {});
      return operation;
    }
  };
}
