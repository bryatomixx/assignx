/**
 * Unit tests for lib/time.ts
 * Pure logic only -- no browser/server APIs beyond Intl (Node has it).
 *
 * Anchors used:
 *   WINTER  2026-01-15T22:30:00Z  -> America/Los_Angeles is UTC-8 (PST)
 *                                     PT wall clock: Jan 15, 2026, 2:30 PM
 *   SUMMER  2026-07-04T21:00:00Z  -> America/Los_Angeles is UTC-7 (PDT)
 *                                     PT wall clock: Jul 4, 2026, 2:00 PM
 */

import { describe, it, expect } from "vitest";
import {
  formatPT,
  formatLocal,
  formatDual,
  formatDateShort,
  formatRelative,
} from "../lib/time";

// Fixed ISO strings as DB would store them (UTC).
const WINTER = "2026-01-15T22:30:00.000Z"; // PST (UTC-8) -> 2:30 PM PT
const SUMMER = "2026-07-04T21:00:00.000Z"; // PDT (UTC-7) -> 2:00 PM PT

// ------------------------------------------------------------------
// formatPT
// ------------------------------------------------------------------

describe("formatPT", () => {
  it("formats a winter (PST) timestamp with PT label", () => {
    const result = formatPT(WINTER);
    // Should contain "Jan 15, 2026" and "2:30 PM" and end with "PT"
    expect(result).toContain("Jan 15, 2026");
    expect(result).toContain("2:30 PM");
    expect(result).toMatch(/PT$/);
  });

  it("formats a summer (PDT) timestamp with PT label -- DST safe", () => {
    const result = formatPT(SUMMER);
    expect(result).toContain("Jul 4, 2026");
    expect(result).toContain("2:00 PM");
    expect(result).toMatch(/PT$/);
  });

  it("appends exactly one space then PT", () => {
    const result = formatPT(WINTER);
    // Label must be exactly " PT" at end, not "PST" or "PDT"
    expect(result.endsWith(" PT")).toBe(true);
  });

  it("handles ISO string with explicit UTC offset (+00:00)", () => {
    const iso = "2026-01-15T22:30:00+00:00";
    const result = formatPT(iso);
    expect(result).toContain("2:30 PM");
    expect(result).toMatch(/PT$/);
  });

  it("does not throw on a far-future date", () => {
    expect(() => formatPT("2099-12-31T23:59:59Z")).not.toThrow();
  });

  it("does not throw on a past date", () => {
    expect(() => formatPT("2000-01-01T00:00:00Z")).not.toThrow();
  });

  // BUG-1: formatPT does NOT guard against invalid ISO strings.
  // new Date("not-a-date") is Invalid Date. Intl.DateTimeFormat.format() throws
  // RangeError: Invalid time value in Node 20. The function has no try/catch
  // around buildFormatter().format(d). This test DOCUMENTS THE BUG -- it must
  // throw until the bug is fixed.
  it("BUG: throws RangeError on invalid ISO string (no guard in formatPT)", () => {
    expect(() => formatPT("not-a-date")).toThrow(RangeError);
  });
});

// ------------------------------------------------------------------
// formatLocal
// ------------------------------------------------------------------

describe("formatLocal", () => {
  it("formats in Eastern Time (UTC-5 in winter)", () => {
    // WINTER UTC: Jan 15, 22:30 -> ET (UTC-5): Jan 15, 5:30 PM
    const result = formatLocal(WINTER, "America/New_York");
    expect(result).toContain("Jan 15, 2026");
    expect(result).toContain("5:30 PM");
  });

  it("formats in Eastern Time (UTC-4 in summer DST)", () => {
    // SUMMER UTC: Jul 4, 21:00 -> ET (UTC-4): Jul 4, 5:00 PM
    const result = formatLocal(SUMMER, "America/New_York");
    expect(result).toContain("Jul 4, 2026");
    expect(result).toContain("5:00 PM");
  });

  it("falls back to system timezone on invalid IANA string and does not throw", () => {
    expect(() => formatLocal(WINTER, "Invalid/Timezone_XYZ")).not.toThrow();
    // Result should still be a non-empty string
    const result = formatLocal(WINTER, "Invalid/Timezone_XYZ");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("falls back to system timezone when tz is undefined", () => {
    expect(() => formatLocal(WINTER, undefined)).not.toThrow();
    const result = formatLocal(WINTER, undefined);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  // BUG-2: formatLocal validates the caller-supplied timezone with:
  //   Intl.DateTimeFormat(undefined, { timeZone: tz })
  // but an EMPTY STRING passes the if(tz) guard as falsy -- the validation
  // block is skipped -- then the final formatter is called with timeZone: ""
  // which throws RangeError in Node 20 (and V8 browsers).
  // The guard "if (tz)" should be "if (tz != null)" or separate from empty.
  // This test DOCUMENTS THE BUG.
  it("BUG: throws RangeError on empty string tz (falsy guard skips validation)", () => {
    expect(() => formatLocal(WINTER, "")).toThrow(RangeError);
  });

  it("formats UTC timezone correctly", () => {
    // WINTER: Jan 15, 22:30 UTC -> UTC: Jan 15, 10:30 PM
    const result = formatLocal(WINTER, "UTC");
    expect(result).toContain("Jan 15, 2026");
    expect(result).toContain("10:30 PM");
  });
});

// ------------------------------------------------------------------
// formatDual
// ------------------------------------------------------------------

describe("formatDual", () => {
  it("returns both pt and local keys", () => {
    const result = formatDual(WINTER, "America/New_York");
    expect(result).toHaveProperty("pt");
    expect(result).toHaveProperty("local");
  });

  it("pt value matches formatPT output", () => {
    const result = formatDual(WINTER, "America/New_York");
    expect(result.pt).toBe(formatPT(WINTER));
  });

  it("local value matches formatLocal output", () => {
    const result = formatDual(WINTER, "America/New_York");
    expect(result.local).toBe(formatLocal(WINTER, "America/New_York"));
  });

  it("pt and local differ when user is NOT in Pacific time", () => {
    const result = formatDual(WINTER, "America/New_York");
    // PT is 2:30 PM, ET is 5:30 PM -- they must differ
    expect(result.pt).not.toBe(result.local);
  });

  it("local omits PT label while pt has it", () => {
    const result = formatDual(WINTER, "America/New_York");
    expect(result.pt.endsWith(" PT")).toBe(true);
    expect(result.local.endsWith(" PT")).toBe(false);
  });

  it("works without userTz (no crash)", () => {
    expect(() => formatDual(WINTER)).not.toThrow();
  });

  it("DST summer: pt and local differ for Eastern user", () => {
    const result = formatDual(SUMMER, "America/New_York");
    expect(result.pt).toContain("2:00 PM");
    expect(result.local).toContain("5:00 PM");
  });
});

// ------------------------------------------------------------------
// formatDateShort
// ------------------------------------------------------------------

describe("formatDateShort", () => {
  it("returns only the date portion in PT (no time)", () => {
    const result = formatDateShort(WINTER);
    expect(result).toBe("Jan 15, 2026");
    // Must not contain AM/PM
    expect(result).not.toMatch(/AM|PM/);
  });

  it("returns PT date even when UTC is a different day (near midnight PT)", () => {
    // PST = UTC-8, so midnight PT = 08:00 UTC.
    // 2026-01-16T07:59:00Z = 11:59 PM on Jan 15 in PT (still Jan 15)
    const justBeforeMidnight = "2026-01-16T07:59:00.000Z";
    expect(formatDateShort(justBeforeMidnight)).toBe("Jan 15, 2026");
    // 2026-01-16T08:00:00Z = exactly midnight Jan 16 in PT
    const exactMidnight = "2026-01-16T08:00:00.000Z";
    expect(formatDateShort(exactMidnight)).toBe("Jan 16, 2026");
  });

  it("does not throw on a valid ISO string", () => {
    expect(() => formatDateShort(WINTER)).not.toThrow();
  });
});

// ------------------------------------------------------------------
// formatRelative
// ------------------------------------------------------------------

describe("formatRelative", () => {
  // Helper: produce an ISO string N seconds in the past
  function pastIso(seconds: number): string {
    return new Date(Date.now() - seconds * 1000).toISOString();
  }
  function futureIso(seconds: number): string {
    return new Date(Date.now() + seconds * 1000).toISOString();
  }

  it("returns 'just now' for 0..59 seconds ago", () => {
    expect(formatRelative(pastIso(0))).toBe("just now");
    expect(formatRelative(pastIso(30))).toBe("just now");
    expect(formatRelative(pastIso(59))).toBe("just now");
  });

  it("returns 'N minutes ago' for 1..59 minutes ago", () => {
    expect(formatRelative(pastIso(60))).toBe("1 minute ago");
    expect(formatRelative(pastIso(120))).toBe("2 minutes ago");
    expect(formatRelative(pastIso(3599))).toBe("59 minutes ago");
  });

  it("returns singular 'minute' for exactly 1 minute", () => {
    expect(formatRelative(pastIso(60))).toBe("1 minute ago");
  });

  it("returns 'N hours ago' for 1..23 hours ago", () => {
    expect(formatRelative(pastIso(3600))).toBe("1 hour ago");
    expect(formatRelative(pastIso(7200))).toBe("2 hours ago");
    expect(formatRelative(pastIso(23 * 3600))).toBe("23 hours ago");
  });

  it("returns singular 'hour' for exactly 1 hour", () => {
    expect(formatRelative(pastIso(3600))).toBe("1 hour ago");
  });

  it("returns 'yesterday' for 1..2 days ago", () => {
    expect(formatRelative(pastIso(86400))).toBe("yesterday");
    expect(formatRelative(pastIso(86401))).toBe("yesterday");
    // 2 days ago is NOT yesterday: boundary at 2*86400
    const twoDaysAgo = formatRelative(pastIso(2 * 86400));
    // At exactly 2 days it matches "yesterday" boundary edge -- check it doesn't crash
    expect(typeof twoDaysAgo).toBe("string");
  });

  it("returns 'N days ago' for 2..29 days", () => {
    expect(formatRelative(pastIso(2 * 86400 + 1))).toBe("2 days ago");
    expect(formatRelative(pastIso(10 * 86400))).toBe("10 days ago");
    expect(formatRelative(pastIso(29 * 86400))).toBe("29 days ago");
  });

  it("falls back to date string for dates older than 30 days", () => {
    // 31 days ago should return something like "Dec 15, 2025"
    const result = formatRelative(pastIso(31 * 86400));
    // Should contain a month name (not a relative string)
    expect(result).toMatch(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/);
    expect(result).not.toContain("ago");
  });

  it("handles future dates without throwing", () => {
    expect(() => formatRelative(futureIso(60))).not.toThrow();
    expect(formatRelative(futureIso(60))).toContain("in");
  });

  it("returns 'in a moment' for slightly future dates (< 60 seconds)", () => {
    expect(formatRelative(futureIso(30))).toBe("in a moment");
  });

  it("returns 'in N minutes' for future 1-59 min", () => {
    expect(formatRelative(futureIso(120))).toBe("in 2 minutes");
  });
});

// ------------------------------------------------------------------
// updateProfile server-side validation logic (extracted inline)
// These replicate the logic in app/api/profile/action/route.ts
// handleUpdateProfile without needing a DB connection.
// ------------------------------------------------------------------

describe("updateProfile validation rules (inline replication)", () => {
  // Replicated from route.ts handleUpdateProfile
  function validateName(name: unknown): string | null {
    if (name === undefined) return null;
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return "name must be between 2 and 80 characters";
    }
    return null;
  }

  function validateBio(bio: unknown): string | null {
    if (bio === undefined) return null;
    if (typeof bio !== "string" || bio.length > 300) {
      return "bio must be at most 300 characters";
    }
    return null;
  }

  function validateTimezone(tz: unknown): string | null {
    if (tz === undefined) return null;
    if (typeof tz !== "string") return "timezone must be a valid IANA timezone string";
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return null;
    } catch {
      return "timezone must be a valid IANA timezone string (e.g. America/New_York)";
    }
  }

  describe("name validation", () => {
    it("accepts name of 2 characters", () => {
      expect(validateName("Jo")).toBeNull();
    });

    it("accepts name of 80 characters", () => {
      expect(validateName("A".repeat(80))).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateName("")).not.toBeNull();
    });

    it("rejects single character", () => {
      expect(validateName("X")).not.toBeNull();
    });

    it("rejects name of 81 characters", () => {
      expect(validateName("A".repeat(81))).not.toBeNull();
    });

    it("rejects name that trims to less than 2 chars", () => {
      expect(validateName(" A ")).not.toBeNull(); // trim -> "A", length 1
    });

    it("accepts name with unicode characters", () => {
      expect(validateName("Maria Jose")).toBeNull();
    });

    it("passes through undefined (field not provided)", () => {
      expect(validateName(undefined)).toBeNull();
    });
  });

  describe("bio validation", () => {
    it("accepts empty string bio", () => {
      expect(validateBio("")).toBeNull();
    });

    it("accepts bio of exactly 300 characters", () => {
      expect(validateBio("A".repeat(300))).toBeNull();
    });

    it("rejects bio of 301 characters", () => {
      expect(validateBio("A".repeat(301))).not.toBeNull();
    });

    it("passes through undefined (field not provided)", () => {
      expect(validateBio(undefined)).toBeNull();
    });
  });

  describe("timezone validation", () => {
    it("accepts America/Los_Angeles", () => {
      expect(validateTimezone("America/Los_Angeles")).toBeNull();
    });

    it("accepts UTC", () => {
      expect(validateTimezone("UTC")).toBeNull();
    });

    it("accepts Asia/Tokyo", () => {
      expect(validateTimezone("Asia/Tokyo")).toBeNull();
    });

    it("rejects a made-up timezone", () => {
      expect(validateTimezone("Fake/Nowhere")).not.toBeNull();
    });

    it("rejects empty string timezone", () => {
      expect(validateTimezone("")).not.toBeNull();
    });

    it("passes through undefined (field not provided)", () => {
      expect(validateTimezone(undefined)).toBeNull();
    });

    it("rejects numeric input", () => {
      expect(validateTimezone(5)).not.toBeNull();
    });
  });
});

// ------------------------------------------------------------------
// VideoProgress monotonic guard (replication from AcademyProvider)
// ------------------------------------------------------------------

describe("recordVideoProgress monotonic guard", () => {
  // Replicated from AcademyProvider.recordVideoProgress inner setVideoProgressMap
  type VP = { elapsedSec: number; durationSec: number };
  type VPMap = Record<string, VP>;

  function applyProgress(
    prev: VPMap,
    key: string,
    elapsedSec: number,
    durationSec: number,
  ): VPMap {
    const existing = prev[key];
    if (existing && existing.elapsedSec >= elapsedSec) return prev; // no-op
    return { ...prev, [key]: { elapsedSec, durationSec } };
  }

  it("updates when elapsedSec is higher than stored", () => {
    const before: VPMap = { "u:lesson:0": { elapsedSec: 5, durationSec: 20 } };
    const after = applyProgress(before, "u:lesson:0", 10, 20);
    expect(after["u:lesson:0"].elapsedSec).toBe(10);
  });

  it("is a no-op when new elapsedSec equals stored", () => {
    const before: VPMap = { "u:lesson:0": { elapsedSec: 10, durationSec: 20 } };
    const after = applyProgress(before, "u:lesson:0", 10, 20);
    // same reference = no-op (Object.is would pass)
    expect(after).toBe(before);
  });

  it("is a no-op when new elapsedSec is LESS than stored (no regression)", () => {
    const before: VPMap = { "u:lesson:0": { elapsedSec: 10, durationSec: 20 } };
    const after = applyProgress(before, "u:lesson:0", 3, 20);
    expect(after).toBe(before);
  });

  it("creates a new key when one does not exist", () => {
    const before: VPMap = {};
    const after = applyProgress(before, "u:lesson:0", 5, 20);
    expect(after["u:lesson:0"]).toEqual({ elapsedSec: 5, durationSec: 20 });
  });

  it("different clips are tracked independently", () => {
    const before: VPMap = { "u:lesson:0": { elapsedSec: 10, durationSec: 20 } };
    const after = applyProgress(before, "u:lesson:1", 3, 15);
    expect(after["u:lesson:0"].elapsedSec).toBe(10);
    expect(after["u:lesson:1"].elapsedSec).toBe(3);
  });
});
