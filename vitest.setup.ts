import "@testing-library/jest-dom/vitest";

process.env.TOTP_ENCRYPTION_KEY ??= "a".repeat(64);
