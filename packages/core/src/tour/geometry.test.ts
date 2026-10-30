import { describe, expect, it } from "vitest";
import { CARD_GAP, CARD_MARGIN, SPOTLIGHT_PAD, cardPlacement, cardWidth, scrollDeltaFor, spotlightFor, type Rect, type Safe } from "./geometry";

const safe: Safe = { width: 390, top: 60, bottom: 760 };
const card = { width: 358, height: 200 };

describe("spotlightFor", () => {
  it("leaves room around the control and keeps it inside the window", () => {
    expect(spotlightFor({ x: 100, y: 300, width: 200, height: 40 }, 390)).toEqual({ x: 100 - SPOTLIGHT_PAD, y: 300 - SPOTLIGHT_PAD, width: 200 + SPOTLIGHT_PAD * 2, height: 40 + SPOTLIGHT_PAD * 2 });
    const wide = spotlightFor({ x: 0, y: 100, width: 390, height: 50 }, 390);
    expect(wide.x).toBe(4);
    expect(wide.x + wide.width).toBe(386);
  });
});

describe("cardWidth", () => {
  it("fills a phone and stops at the maximum on a tablet", () => {
    expect(cardWidth(390)).toBe(390 - CARD_MARGIN * 2);
    expect(cardWidth(1024)).toBe(400);
  });
});

describe("cardPlacement", () => {
  it("centers the card when there is no control", () => {
    const placement = cardPlacement({ target: null, safe, card });
    expect(placement.side).toBe("center");
    expect(placement.left).toBe(16);
    expect(placement.top).toBe(60 + (700 - 200) / 2);
  });

  it("goes under a control near the top and above one near the bottom", () => {
    const high: Rect = { x: 20, y: 100, width: 100, height: 40 };
    expect(cardPlacement({ target: high, safe, card })).toMatchObject({ side: "bottom", top: 100 - SPOTLIGHT_PAD + 40 + SPOTLIGHT_PAD * 2 + CARD_GAP });
    const low: Rect = { x: 20, y: 650, width: 100, height: 40 };
    const placement = cardPlacement({ target: low, safe, card });
    expect(placement.side).toBe("top");
    expect(placement.top).toBe(650 - SPOTLIGHT_PAD - CARD_GAP - 200);
  });

  it("follows the side a step asks for when it fits there", () => {
    const middle: Rect = { x: 20, y: 380, width: 100, height: 40 };
    expect(cardPlacement({ target: middle, safe, card, prefer: "top" }).side).toBe("top");
    expect(cardPlacement({ target: middle, safe, card, prefer: "bottom" }).side).toBe("bottom");
  });

  it("covers the bottom of the safe area when a control leaves no room on either side", () => {
    const tall: Rect = { x: 20, y: 70, width: 350, height: 680 };
    expect(cardPlacement({ target: tall, safe, card })).toMatchObject({ side: "overlay", top: 760 - 200 });
  });

  it("keeps the card on the screen when its control is scrolled out of the safe area", () => {
    // Below the screen (the accuracy table, before the page scrolls to it): a card "above" it would be off the screen.
    const below: Rect = { x: 20, y: 1300, width: 350, height: 520 };
    const placed = cardPlacement({ target: below, safe, card, prefer: "top" });
    expect(placed).toMatchObject({ side: "overlay", top: 760 - 200 });
    // Above the screen: a card "below" it would start above the safe area.
    const above: Rect = { x: 20, y: -300, width: 350, height: 40 };
    expect(cardPlacement({ target: above, safe, card })).toMatchObject({ side: "overlay", top: 760 - 200 });
  });
});

describe("scrollDeltaFor", () => {
  it("does not scroll when the control and its card already fit", () => {
    expect(scrollDeltaFor({ target: { x: 20, y: 200, width: 100, height: 40 }, safe, cardHeight: 200 })).toBe(0);
    expect(scrollDeltaFor({ target: { x: 20, y: 600, width: 100, height: 40 }, safe, cardHeight: 200 })).toBe(0);
  });

  it("scrolls down so a control below the card's room comes near the top", () => {
    const delta = scrollDeltaFor({ target: { x: 20, y: 700, width: 100, height: 100 }, safe, cardHeight: 200 });
    expect(delta).toBe(700 - SPOTLIGHT_PAD - (60 + CARD_MARGIN));
  });

  it("scrolls up for a control hidden under the top", () => {
    const delta = scrollDeltaFor({ target: { x: 20, y: -200, width: 100, height: 100 }, safe, cardHeight: 200 });
    expect(delta).toBeLessThan(0);
  });
});
