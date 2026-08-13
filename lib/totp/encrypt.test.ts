import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, fromBytea, toBytea } from "./encrypt";

const KEY = "ab".repeat(32);

describe("totp bytea encoding", () => {
  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY;
  });

  it("JSON.stringify of a Buffer is not a Postgres bytea value", () => {
    const json = JSON.parse(JSON.stringify({ ciphertext: Buffer.from("secret") }));
    expect(json.ciphertext).toEqual({ type: "Buffer", data: expect.any(Array) });
    expect(typeof json.ciphertext).toBe("object");
  });

  it("roundtrips a TOTP secret through PostgREST \\x hex encoding", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    const { ciphertext, iv } = encryptSecret("JBSWY3DPEHPK3PXP");
    const storedCt = toBytea(ciphertext);
    const storedIv = toBytea(iv);
    expect(storedCt.startsWith("\\x")).toBe(true);
    expect(storedIv.startsWith("\\x")).toBe(true);
    expect(decryptSecret(fromBytea(storedCt), fromBytea(storedIv))).toBe("JBSWY3DPEHPK3PXP");
  });
});
