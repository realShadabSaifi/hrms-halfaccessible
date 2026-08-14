import { describe, expect, it } from "vitest";
import {
  canDecideLeave,
  canDeleteAnonMessage,
  canInsertAnnouncement,
  canManageDepartments,
  canManageHolidays,
  canManageSettings,
  canManageUsers,
  canSelectTotpCredentials,
  canViewTeamLeaves,
} from "@/lib/rls/policies";

describe("RLS policy contract", () => {
  it("employee cannot approve others leaves", () => {
    expect(canDecideLeave("employee")).toBe(false);
    expect(canDecideLeave("lead")).toBe(true);
    expect(canDecideLeave("admin")).toBe(true);
    expect(canDecideLeave("super_admin")).toBe(false);
  });

  it("only leads and admins see team leave queues", () => {
    expect(canViewTeamLeaves("employee")).toBe(false);
    expect(canViewTeamLeaves("lead")).toBe(true);
  });

  it("anon insert has no user_id by design", () => {
    expect(canDeleteAnonMessage("admin")).toBe(false);
    expect(canDeleteAnonMessage("employee")).toBe(false);
  });

  it("authenticated cannot select totp_credentials", () => {
    expect(canSelectTotpCredentials("authenticated")).toBe(false);
    expect(canSelectTotpCredentials("anon")).toBe(false);
    expect(canSelectTotpCredentials("service_role")).toBe(true);
  });

  it("only leads and admins post announcements", () => {
    expect(canInsertAnnouncement("employee")).toBe(false);
    expect(canInsertAnnouncement("lead")).toBe(true);
  });

  it("admins and super_admins manage users", () => {
    expect(canManageUsers("lead")).toBe(false);
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("super_admin")).toBe(true);
  });

  it("only super_admin changes portal settings", () => {
    expect(canManageSettings("employee")).toBe(false);
    expect(canManageSettings("lead")).toBe(false);
    expect(canManageSettings("admin")).toBe(false);
    expect(canManageSettings("super_admin")).toBe(true);
  });

  it("only super_admin manages departments", () => {
    expect(canManageDepartments("employee")).toBe(false);
    expect(canManageDepartments("lead")).toBe(false);
    expect(canManageDepartments("admin")).toBe(false);
    expect(canManageDepartments("super_admin")).toBe(true);
  });

  it("admins and super_admins manage company holidays", () => {
    expect(canManageHolidays("employee")).toBe(false);
    expect(canManageHolidays("lead")).toBe(false);
    expect(canManageHolidays("admin")).toBe(true);
    expect(canManageHolidays("super_admin")).toBe(true);
  });
});
