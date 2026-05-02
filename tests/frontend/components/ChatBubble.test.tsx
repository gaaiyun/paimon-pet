import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "../../../src/components/ChatBubble";

describe("ChatBubble", () => {
  it("renders assistant message", () => {
    render(<ChatBubble role="assistant" text="你好旅行者！" />);
    expect(screen.getByText("你好旅行者！")).toBeDefined();
  });

  it("renders user message", () => {
    render(<ChatBubble role="user" text="你好派蒙" />);
    expect(screen.getByText("你好派蒙")).toBeDefined();
  });

  it("has correct CSS class for role", () => {
    const { container } = render(<ChatBubble role="assistant" text="test" />);
    expect(container.firstChild).toHaveClass("chat-bubble-assistant");
  });
});
