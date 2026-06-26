import test from "node:test";
import assert from "node:assert/strict";
import { assertAccessTokenVersionMatches } from "../utils/accessTokenVersion.js";
import { UnauthorizedError } from "../utils/errors.js";

test("rejects when JWT has no tv (no legacy bypass)", () => {
  assert.throws(
    () => assertAccessTokenVersionMatches({ tokenVersion: 0 }, { sub: 1, typ: "access" }),
    UnauthorizedError
  );
});

test("rejects when tv is not an integer", () => {
  assert.throws(
    () => assertAccessTokenVersionMatches({ tokenVersion: 1 }, { sub: 1, typ: "access", tv: "1" }),
    UnauthorizedError
  );
});

test("rejects when tv is negative", () => {
  assert.throws(
    () => assertAccessTokenVersionMatches({ tokenVersion: 1 }, { sub: 1, typ: "access", tv: -1 }),
    UnauthorizedError
  );
});

test("matching tv passes", () => {
  assertAccessTokenVersionMatches({ tokenVersion: 3 }, { sub: 1, typ: "access", tv: 3 });
});

test("tv mismatch rejects", () => {
  assert.throws(
    () => assertAccessTokenVersionMatches({ tokenVersion: 3 }, { sub: 1, typ: "access", tv: 2 }),
    UnauthorizedError
  );
});
