// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import LazyMount from "./LazyMount";

// React's act() needs this flag outside a testing-library setup.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let observers: { cb: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[];

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  observers = [];
  class FakeIntersectionObserver {
    cb: IntersectionObserverCallback;
    disconnect = vi.fn();
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const child = () => createElement("p", { id: "widget" }, "widget content");

describe("LazyMount", () => {
  it("does not mount the widget until it comes near the viewport", () => {
    act(() => root.render(createElement(LazyMount, { minHeight: 300, id: "box" }, child())));
    expect(container.querySelector("#widget")).toBeNull();
    expect((container.querySelector("#box") as HTMLElement).style.minHeight).toBe("300px");

    act(() => observers[0].cb([{ isIntersecting: true } as IntersectionObserverEntry], observers[0] as unknown as IntersectionObserver));
    expect(container.querySelector("#widget")?.textContent).toBe("widget content");
    expect((container.querySelector("#box") as HTMLElement).style.minHeight).toBe("");
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it("ignores notifications while still far away", () => {
    act(() => root.render(createElement(LazyMount, null, child())));
    act(() => observers[0].cb([{ isIntersecting: false } as IntersectionObserverEntry], observers[0] as unknown as IntersectionObserver));
    expect(container.querySelector("#widget")).toBeNull();
  });

  it("mounts right away when IntersectionObserver is not available", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    act(() => root.render(createElement(LazyMount, null, child())));
    expect(container.querySelector("#widget")).not.toBeNull();
  });
});
