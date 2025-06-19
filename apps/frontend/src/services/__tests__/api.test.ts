import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", async () => {
  const actual = await vi.importActual<any>("@sentry/react");
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      fmt: (strings: TemplateStringsArray, ...values: any[]) =>
        String.raw({ raw: strings }, ...values),
    },
    startSpan: (opts: any, fn: any) => fn(),
  };
});

import { api } from "../api";
// import * as Sentry from "@sentry/react";

global.fetch = vi.fn();

const mockFetch = (data: any, ok = true, status = 200) => {
  (fetch as any).mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  });
};

const mockFetchError = (status = 500, message = "fail") => {
  (fetch as any).mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ message }),
  });
};

describe("api", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("courses", () => {
    it("getAll calls correct endpoint with params", async () => {
      mockFetch([1, 2, 3]);
      const data = await api.courses.getAll({ category: "a", level: "b" });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses?category=a&level=b"),
        expect.objectContaining({ credentials: "include" })
      );
      expect(data).toEqual([1, 2, 3]);
    });
    it("getById calls correct endpoint", async () => {
      mockFetch({ id: 1 });
      const data = await api.courses.getById("1");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/1"),
        expect.any(Object)
      );
      expect(data).toEqual({ id: 1 });
    });
    it("create sends POST with body", async () => {
      mockFetch({ id: 2 });
      const payload = { name: "test" };
      await api.courses.create(payload);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    });
    it("update sends PUT with body", async () => {
      mockFetch({ id: 2 });
      await api.courses.update("2", { name: "x" });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/2"),
        expect.objectContaining({ method: "PUT" })
      );
    });
    it("getCategories calls correct endpoint", async () => {
      mockFetch(["cat"]);
      await api.courses.getCategories();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/categories"),
        expect.any(Object)
      );
    });
  });

  describe("lessons", () => {
    it("getByCourse calls correct endpoint", async () => {
      mockFetch([1]);
      await api.lessons.getByCourse("cid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/lessons/course/cid"),
        expect.any(Object)
      );
    });
    it("getById calls correct endpoint", async () => {
      mockFetch({});
      await api.lessons.getById("lid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/lessons/lid"),
        expect.any(Object)
      );
    });
    it("create sends POST with body", async () => {
      mockFetch({});
      await api.lessons.create({ foo: "bar" });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/lessons"),
        expect.objectContaining({ method: "POST" })
      );
    });
    it("update sends PUT with body", async () => {
      mockFetch({});
      await api.lessons.update("lid", { foo: 1 });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/lessons/lid"),
        expect.objectContaining({ method: "PUT" })
      );
    });
    it("markComplete sends POST", async () => {
      mockFetch({});
      await api.lessons.markComplete("lid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/lessons/lid/complete"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("users", () => {
    it("getProfile calls correct endpoint", async () => {
      mockFetch({});
      await api.users.getProfile();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        expect.any(Object)
      );
    });
    it("updateProfile sends PUT with body", async () => {
      mockFetch({});
      await api.users.updateProfile({ foo: 1 });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        expect.objectContaining({ method: "PUT" })
      );
    });
    it("getEnrollments calls correct endpoint", async () => {
      mockFetch([]);
      await api.users.getEnrollments();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me/enrollments"),
        expect.any(Object)
      );
    });
  });

  describe("enrollments", () => {
    it("create sends POST with courseId", async () => {
      mockFetch({});
      await api.enrollments.create("cid", "uid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enrollments"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ courseId: "cid" }),
        })
      );
    });

    it("create works with undefined userId", async () => {
      mockFetch({});
      await api.enrollments.create("cid", undefined);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enrollments"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ courseId: "cid" }),
        })
      );
    });

    it("getUserEnrollments calls correct endpoint", async () => {
      mockFetch([]);
      await api.enrollments.getUserEnrollments("uid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enrollments/user/uid"),
        expect.any(Object)
      );
    });
    it("getProgress calls correct endpoint", async () => {
      mockFetch({});
      await api.enrollments.getProgress("eid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enrollments/eid/progress"),
        expect.any(Object)
      );
    });
    it("delete sends DELETE", async () => {
      mockFetch({});
      await api.enrollments.delete("eid");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enrollments/eid"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("search", () => {
    it("courses calls Sentry.startSpan and fetchApi", async () => {
      mockFetch([1, 2]);
      const data = await api.search.courses("react");
      expect(Sentry.logger.info).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/search/courses?q=react"),
        expect.any(Object)
      );
      expect(data).toEqual([1, 2]);
    });
  });

  describe("error handling", () => {
    it("throws ApiError on non-ok response", async () => {
      mockFetchError(404, "Not found");
      await expect(api.courses.getById("bad")).rejects.toMatchObject({
        name: "ApiError",
        status: 404,
        message: "Not found",
      });
    });
    it("throws network error on fetch failure", async () => {
      (fetch as any).mockRejectedValue(new Error("fail"));
      await expect(api.courses.getById("bad")).rejects.toThrow(/Network error/);
    });
    it("throws ApiError with fallback message if response.json fails", async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("fail")),
      });
      await expect(api.courses.getById("bad")).rejects.toMatchObject({
        name: "ApiError",
        status: 500,
        message: "An error occurred",
      });
    });
  });
});
