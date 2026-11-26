import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { serverAnswer } from "#/components/save-failure.ts";
import { toast } from "#/components/ui/toast.tsx";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("serverAnswer", () => {
  it("answers null when the call throws, toasting it and logging the tag and the error's class but not its message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const add = vi.spyOn(toast, "add");

    const answer = await serverAnswer("member-save", "/personal/m-1", async () => {
      throw new TypeError("Failed query: insert into member params: ana@example.com,Ana");
    });

    expect(answer).toBeNull();
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: "destructive" }));
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith({
      tag: "save-failed",
      message: "a server call threw",
      call: "member-save",
      path: "/personal/m-1",
      error: "TypeError",
    });
  });
});
