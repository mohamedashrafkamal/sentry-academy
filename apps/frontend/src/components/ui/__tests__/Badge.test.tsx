import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders with default props", () => {
    render(<Badge>Default</Badge>);
    expect(screen.queryByText("Default")).to.not.be.null;
  });

  it("applies the correct variant and size classes", () => {
    render(
      <Badge variant="primary" size="lg">
        Primary
      </Badge>
    );
    const badge = screen.getByText("Primary");
    expect(badge.className).to.include("bg-blue-100");
    expect(badge.className).to.include("px-3");
  });
});
