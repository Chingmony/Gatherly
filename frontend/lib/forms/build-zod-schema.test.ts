import { describe, expect, it } from "vitest";
import { validateAnswers } from "./build-zod-schema";
import type { FormField } from "../api/types";

const EMAIL: FormField = { key: "email", label: "Email", type: "email", required: true, order: 1 };
const PHONE: FormField = { key: "phone", label: "Phone", type: "phone", required: true, order: 2 };

/** Mirrors docs/02 §6.1 — the FE renderer's Zod mirror must agree with the server validator. */
describe("validateAnswers", () => {
  it("accepts a fully valid required email + phone submission", () => {
    const errors = validateAnswers([EMAIL, PHONE], { email: "dara@example.com", phone: "+855 12 345 678" });
    expect(errors).toEqual({});
  });

  it("flags a missing required field with its label", () => {
    const errors = validateAnswers([EMAIL, PHONE], { email: "dara@example.com" });
    expect(errors.phone).toBe("Phone is required.");
  });

  it("rejects a malformed email but allows a valid one", () => {
    expect(validateAnswers([EMAIL], { email: "not-an-email" }).email).toBe("Enter a valid email address.");
    expect(validateAnswers([EMAIL], { email: "ok@ex.io" })).toEqual({});
  });

  it("rejects a malformed phone number", () => {
    expect(validateAnswers([PHONE], { phone: "abc" }).phone).toBe("Enter a valid phone number.");
  });

  it("skips optional fields that are absent or blank", () => {
    const company: FormField = { key: "company", label: "Company", type: "text", required: false, order: 1 };
    expect(validateAnswers([company], {})).toEqual({});
    expect(validateAnswers([company], { company: "   " })).toEqual({});
  });

  it("enforces select option membership", () => {
    const meal: FormField = { key: "meal", label: "Meal", type: "select", required: true, order: 1, options: ["Veg", "Vegan"] };
    expect(validateAnswers([meal], { meal: "Steak" }).meal).toBe("Choose a valid option.");
    expect(validateAnswers([meal], { meal: "Vegan" })).toEqual({});
  });

  it("enforces multiselect option membership and array shape", () => {
    const tags: FormField = { key: "tags", label: "Tags", type: "multiselect", required: true, order: 1, options: ["A", "B"] };
    expect(validateAnswers([tags], { tags: ["A", "Z"] }).tags).toBe("Choose valid options.");
    expect(validateAnswers([tags], { tags: "A" }).tags).toBe("Expected a list of options.");
    expect(validateAnswers([tags], { tags: ["A", "B"] })).toEqual({});
  });

  it("validates number type and min/max range", () => {
    const age: FormField = { key: "age", label: "Age", type: "number", required: true, order: 1, validation: { min: 18, max: 99 } };
    expect(validateAnswers([age], { age: "nope" }).age).toBe("Age must be a number.");
    expect(validateAnswers([age], { age: 10 }).age).toBe("Too small.");
    expect(validateAnswers([age], { age: 120 }).age).toBe("Too large.");
    expect(validateAnswers([age], { age: 30 })).toEqual({});
  });

  it("enforces minLength / maxLength / pattern on text", () => {
    const code: FormField = {
      key: "code", label: "Code", type: "text", required: true, order: 1,
      validation: { minLength: 3, maxLength: 5, pattern: "^[A-Z]+$" },
    };
    expect(validateAnswers([code], { code: "AB" }).code).toBe("Too short.");
    expect(validateAnswers([code], { code: "ABCDEF" }).code).toBe("Too long.");
    expect(validateAnswers([code], { code: "abc" }).code).toBe("Invalid format.");
    expect(validateAnswers([code], { code: "ABC" })).toEqual({});
  });

  it("does not crash on a malformed regex pattern", () => {
    const f: FormField = { key: "x", label: "X", type: "text", required: true, order: 1, validation: { pattern: "(" } };
    expect(validateAnswers([f], { x: "anything" })).toEqual({});
  });
});
