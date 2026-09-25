import { describe, expect, it } from "vitest";
import {
  blocksNewAssignment,
  formatDay,
  formatPercent,
  operatorPercent,
  parseOwnerPercent,
  periodLabel,
  periodState,
  providerLabel,
  todayISO,
  vehicleDetail,
  vehicleName,
} from "./format";

const jetta = { year: 2019, make: "Volkswagen", model: "Jetta", color: "White", license_plate: "STLN58" };

describe("consigner formatting", () => {
  it("names vehicles and their details", () => {
    expect(vehicleName(jetta)).toBe("2019 Volkswagen Jetta");
    expect(vehicleDetail(jetta)).toBe("White · STLN58");
    expect(vehicleDetail({ ...jetta, license_plate: null })).toBe("White");
  });

  it("formats calendar days without shifting time zones", () => {
    expect(formatDay("2026-09-17")).toBe("Sep 17, 2026");
    expect(todayISO(new Date(2026, 8, 25, 23, 30))).toBe("2026-09-25");
  });

  it("accepts owner shares from 0 to 100 with up to two decimals", () => {
    expect(parseOwnerPercent("60")).toBe(60);
    expect(parseOwnerPercent(" 62.5 ")).toBe(62.5);
    expect(parseOwnerPercent("0")).toBe(0);
    expect(parseOwnerPercent("100")).toBe(100);
    expect(parseOwnerPercent("100.01")).toBeNull();
    expect(parseOwnerPercent("150")).toBeNull();
    expect(parseOwnerPercent("-5")).toBeNull();
    expect(parseOwnerPercent("33.333")).toBeNull();
    expect(parseOwnerPercent("")).toBeNull();
    expect(parseOwnerPercent("sixty")).toBeNull();
  });

  it("derives the operator's share and formats percentages", () => {
    expect(operatorPercent(60)).toBe(40);
    expect(operatorPercent(66.67)).toBe(33.33);
    expect(formatPercent(40)).toBe("40%");
    expect(formatPercent(62.5)).toBe("62.5%");
    expect(formatPercent(33.33)).toBe("33.33%");
  });

  it("classifies assignment periods", () => {
    const today = "2026-09-25";
    expect(periodState({ effective_from: "2026-09-17", effective_to: null }, today)).toBe("current");
    expect(periodState({ effective_from: "2026-10-01", effective_to: null }, today)).toBe("upcoming");
    expect(periodState({ effective_from: "2026-01-01", effective_to: "2026-09-24" }, today)).toBe("ended");
    expect(periodState({ effective_from: "2026-01-01", effective_to: today }, today)).toBe("current");

    expect(blocksNewAssignment({ effective_from: "2026-09-17", effective_to: null }, today)).toBe(true);
    expect(blocksNewAssignment({ effective_from: "2026-01-01", effective_to: "2026-12-31" }, today)).toBe(true);
    expect(blocksNewAssignment({ effective_from: "2026-01-01", effective_to: "2026-09-24" }, today)).toBe(false);
  });

  it("labels assignment periods", () => {
    const today = "2026-09-25";
    expect(periodLabel({ effective_from: "2026-09-17", effective_to: null }, today)).toBe("Since Sep 17, 2026");
    expect(periodLabel({ effective_from: "2026-10-01", effective_to: null }, today)).toBe("Starts Oct 1, 2026");
    expect(periodLabel({ effective_from: "2026-09-17", effective_to: "2026-12-31" }, today)).toBe(
      "Sep 17, 2026 – Dec 31, 2026",
    );
  });

  it("labels sign-in methods", () => {
    expect(providerLabel(["google"])).toBe("Google");
    expect(providerLabel(["email", "google"])).toBe("Email + Google");
    expect(providerLabel([])).toBe("Email");
  });
});
