import test from "node:test";
import assert from "node:assert/strict";
import { confirmPasswordChangeSchema } from "../validators/schemas.js";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

test("confirmPasswordChange rejects weak password (letters only)", () => {
  const { error } = confirmPasswordChangeSchema.validate({
    requestId: validUuid,
    code: "123456",
    newPassword: "abcdefgh",
    confirmPassword: "abcdefgh",
  });
  assert.ok(error);
});

test("confirmPasswordChange rejects missing symbol", () => {
  const { error } = confirmPasswordChangeSchema.validate({
    requestId: validUuid,
    code: "123456",
    newPassword: "abcdefgh1",
    confirmPassword: "abcdefgh1",
  });
  assert.ok(error);
});

test("confirmPasswordChange rejects mismatch", () => {
  const { error } = confirmPasswordChangeSchema.validate({
    requestId: validUuid,
    code: "123456",
    newPassword: "Abcd#1234",
    confirmPassword: "Abcd#5678",
  });
  assert.ok(error);
});

test("confirmPasswordChange rejects invalid requestId", () => {
  const { error } = confirmPasswordChangeSchema.validate({
    requestId: "not-a-uuid",
    code: "123456",
    newPassword: "Abcd#1234",
    confirmPassword: "Abcd#1234",
  });
  assert.ok(error);
});

test("confirmPasswordChange accepts strong matching password and uuid v4", () => {
  const { error, value } = confirmPasswordChangeSchema.validate({
    requestId: validUuid,
    code: "123456",
    newPassword: "Abcd#1234",
    confirmPassword: "Abcd#1234",
  });
  assert.equal(error, undefined);
  assert.equal(value.code, "123456");
  assert.equal(value.newPassword, "Abcd#1234");
  assert.equal(value.requestId, validUuid);
});
