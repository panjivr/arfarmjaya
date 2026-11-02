import { test } from "node:test";
import assert from "node:assert/strict";
import { documentFileName } from "../src/lib/utils";

test("nama PDF mengikuti nomor dokumen dan membuang karakter terlarang", () => {
  assert.equal(
    documentFileName(["UD Gemilang", "INVAL0007", "SPPG Ngraket"], "Invoice"),
    "UD Gemilang - INVAL0007 - SPPG Ngraket",
  );
  assert.equal(
    documentFileName(["AR FARM JAYA", "001/SPH/XI/2026", "SPPG Ngraket"], "Surat"),
    "AR FARM JAYA - 001-SPH-XI-2026 - SPPG Ngraket",
  );
  assert.equal(documentFileName(["", "  ", null], "Invoice"), "Invoice");
  assert.equal(documentFileName(['Inv:1*?"<>|'], "Invoice"), "Inv 1");
  assert.equal(documentFileName(["x".repeat(200)], "Invoice").length, 120);
});
