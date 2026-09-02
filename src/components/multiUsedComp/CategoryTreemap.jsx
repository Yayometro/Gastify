"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { buildCategoryHierarchy, getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import { formatMoneyMajor } from "@/lib/money/currencies";
import UniversalCategoIcon from "./UniversalCategoIcon";

// Hand-rolled squarified treemap (Bruls/Huizing/van Wijk algorithm), laid
// out once against a fixed nominal box and then rendered as percentages -
// no ResizeObserver/canvas library involved, so there's nothing that can
// silently fail to measure its container. `nodes` must already be sorted
// descending by value; zero/negative values are meaningless for area math
// and are filtered out by the caller.
function worstRatio(row, shortSide) {
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  for (const item of row) {
    sum += item.area;
    if (item.area > max) max = item.area;
    if (item.area < min) min = item.area;
  }
  if (min <= 0) return Infinity;
  return Math.max(
    (shortSide * shortSide * max) / (sum * sum),
    (sum * sum) / (shortSide * shortSide * min)
  );
}

function squarify(nodes, x0, y0, w0, h0) {
  const total = nodes.reduce((sum, n) => sum + n.value, 0);
  if (total <= 0 || nodes.length === 0 || w0 <= 0 || h0 <= 0) return [];
  const scale = (w0 * h0) / total;
  let remaining = nodes.map((n) => ({ node: n, area: n.value * scale }));
  const rects = [];
  let x = x0;
  let y = y0;
  let w = w0;
  let h = h0;

  while (remaining.length) {
    const shortSide = Math.min(w, h);
    let row = [remaining[0]];
    let rowWorst = worstRatio(row, shortSide);
    let i = 1;
    while (i < remaining.length) {
      const trial = row.concat(remaining[i]);
      const trialWorst = worstRatio(trial, shortSide);
      if (trialWorst <= rowWorst) {
        row = trial;
        rowWorst = trialWorst;
        i += 1;
      } else {
        break;
      }
    }
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    if (w >= h) {
      const rowWidth = rowArea / h;
      let ry = y;
      row.forEach((item) => {
        const itemHeight = item.area / rowWidth;
        rects.push({ node: item.node, x, y: ry, width: rowWidth, height: itemHeight });
        ry += itemHeight;
      });
      x += rowWidth;
      w -= rowWidth;
    } else {
      const rowHeight = rowArea / w;
      let rx = x;
      row.forEach((item) => {
        const itemWidth = item.area / rowHeight;
        rects.push({ node: item.node, x: rx, y, width: itemWidth, height: rowHeight });
        rx += itemWidth;
      });
      y += rowHeight;
      h -= rowHeight;
    }
    remaining = remaining.slice(row.length);
  }
  return rects;
}

// Layout is computed once against this fixed nominal box, then every tile
// is rendered as a percentage of it - the actual rendered aspect ratio is
// set purely with CSS (`aspect-*` classes below), so real container
// measurement (ResizeObserver et al.) is never needed.
const NOMINAL_W = 1000;
const NOMINAL_H = 420;
const BIG_TILE_MIN_W = 150;
const BIG_TILE_MIN_H = 95;
// Roughly the tooltip's own footprint - used to decide whether there's
// still room to grow right/down from the cursor, or whether it needs to
// flip to the left/up instead so it doesn't get clipped by the card's
// rounded (overflow-hidden) edge.
const TOOLTIP_W_ESTIMATE = 200;
const TOOLTIP_H_ESTIMATE = 190;

function TreemapTile({ rect, index, isBig, canDrill, isSelected, pct, currency, onClick, entered, containerRef }) {
  const { node } = rect;
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0, h: 0, flipX: false, flipY: false });

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    let flipX = false;
    let flipY = false;
    if (containerRef?.current) {
      const cb = containerRef.current.getBoundingClientRect();
      flipX = cb.right - e.clientX < TOOLTIP_W_ESTIMATE;
      flipY = cb.bottom - e.clientY < TOOLTIP_H_ESTIMATE;
    }
    setPos({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
      w: bounds.width,
      h: bounds.height,
      flipX,
      flipY,
    });
  };

  const restingStyle = entered
    ? { backgroundColor: node.color || "#8884d8" }
    : {
        backgroundColor: node.color || "#8884d8",
        opacity: 0,
        transform: "scale(0.9)",
        transitionDelay: `${Math.min(index, 16) * 22}ms`,
      };

  return (
    <div
      className="absolute"
      style={{
        left: `${(rect.x / NOMINAL_W) * 100}%`,
        top: `${(rect.y / NOMINAL_H) * 100}%`,
        width: `${(rect.width / NOMINAL_W) * 100}%`,
        height: `${(rect.height / NOMINAL_H) * 100}%`,
        zIndex: hover ? 30 : undefined,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={handleMouseMove}
    >
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-[3px] rounded-xl flex items-start p-2 text-left overflow-hidden transition-transform duration-200 ease-out"
        style={{
          ...restingStyle,
          transform: entered && hover ? "scale(1.025)" : restingStyle.transform,
          boxShadow: hover ? "0 8px 20px rgba(15, 15, 25, 0.25)" : undefined,
          transitionProperty: "opacity, transform, box-shadow",
          transitionDuration: "280ms",
          transitionTimingFunction: "ease",
          cursor: canDrill ? "pointer" : "default",
          outline: isSelected ? "3px solid #7c3aed" : undefined,
          outlineOffset: isSelected ? "-3px" : undefined,
        }}
      >
        {/* A label chip with its own solid white surface - the tile itself
            can be any category color (including pale ones like yellow), so
            text can't just sit directly on top of it and stay legible; a
            clearly-opaque chip (not a faint blur) keeps title + amount
            readable and consistent regardless. Icon sits centered against
            the title+amount block as a unit, not pinned to the title line. */}
        {isBig ? (
          <div className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-[0_2px_10px_rgba(15,15,25,0.18)]">
            <span
              className="flex items-center justify-center h-8 w-8 rounded-full shrink-0"
              style={{ backgroundColor: node.color || "#8884d8" }}
            >
              <UniversalCategoIcon type={node.icon} siz={16} colore="#fff" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-slate-800 font-bold text-xs truncate">{node.name}</span>
              <span className="text-slate-500 text-[11px] font-semibold">
                {formatMoneyMajor(node.value, currency)}
              </span>
              {node.kind === "transaction" ? (
                node.date && (
                  <span className="text-slate-400 text-[10px]">{dayjs(node.date).format("DD/MM/YYYY")}</span>
                )
              ) : (
                <span className="text-slate-400 text-[10px]">
                  {node.transactionCount} txn{node.transactionCount === 1 ? "" : "s"} · {pct}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="inline-block max-w-full truncate rounded-md bg-white px-1.5 py-0.5 text-slate-800 text-[10px] font-semibold shadow-[0_2px_8px_rgba(15,15,25,0.15)]">
            {node.name}
          </span>
        )}
      </button>

      {/* Tooltip follows the cursor (matching the original concept demo)
          instead of sitting fixed in the tile's center - light card with a
          real shadow, not the dark floating card from the previous pass.
          Transactions get their full detail (date/account/category/tags);
          category & subcategory tiles get a count of the transactions
          rolled up into them alongside the amount/percentage. */}
      {hover && (
        <div
          className="pointer-events-none absolute z-40 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 bg-white border border-slate-100 min-w-[140px] max-w-[220px]"
          style={{
            left: pos.flipX ? undefined : pos.x + 16,
            right: pos.flipX ? pos.w - pos.x + 16 : undefined,
            top: pos.flipY ? undefined : pos.y + 16,
            bottom: pos.flipY ? pos.h - pos.y + 16 : undefined,
            boxShadow: "0 12px 28px rgba(15, 15, 25, 0.18)",
          }}
        >
          <span
            className="flex items-center justify-center h-14 w-14 rounded-full border-2 border-slate-200 shrink-0"
            style={{ backgroundColor: node.color || "#8884d8" }}
          >
            <UniversalCategoIcon type={node.icon} siz={27} colore="#fff" />
          </span>
          <span className="text-slate-800 font-bold text-sm text-center leading-tight">
            {node.name}
          </span>
          <span className="text-slate-500 text-xs font-semibold">
            {formatMoneyMajor(node.value, currency)}
          </span>
          {node.kind === "transaction" ? (
            <>
              <div className="w-full border-t border-slate-100 my-0.5" />
              {node.date && (
                <span className="text-slate-500 text-[11px]">{dayjs(node.date).format("DD/MM/YYYY")}</span>
              )}
              {node.accountName && (
                <span className="text-slate-500 text-[11px]">Cuenta: {node.accountName}</span>
              )}
              {(node.categoryName || node.subcategoryName) && (
                <span className="text-slate-500 text-[11px] text-center">
                  {node.categoryName}
                  {node.subcategoryName ? ` · ${node.subcategoryName}` : ""}
                </span>
              )}
              {node.tags && node.tags.length > 0 && (
                <span className="text-slate-400 text-[10px] text-center">
                  {node.tags.map((tag) => tag.name).filter(Boolean).join(", ")}
                </span>
              )}
              <span className="text-slate-400 text-[11px]">{pct}% del total</span>
            </>
          ) : (
            <>
              <span className="text-slate-400 text-[11px]">
                {node.transactionCount} transaccion{node.transactionCount === 1 ? "" : "es"}
              </span>
              <span className="text-slate-400 text-[11px]">{pct}% del total</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Only skip straight to individual transactions when there's at most ONE
// real subcategory to show - that's the "one giant near-empty tile" case
// (e.g. a category whose only subcategory holds everything). The moment
// there are two or more real subcategories, they're a meaningful division
// (e.g. Food's "Despensa" vs "Proteina") and must be shown as their own
// layer first, even if some of those subcategories are themselves small.
const AUTO_EXPAND_SUBCATEGORY_THRESHOLD = 1;

function transactionNode(t, keyPrefix, color, icon, categoryName, subcategoryName) {
  return {
    key: t._id || `${keyPrefix}-${t.date || ""}-${t.name || ""}`,
    name: t.name || "Transaction",
    color,
    icon,
    value: getPrimaryAmount(t),
    hasChildren: false,
    kind: "transaction",
    date: t.date,
    accountName: t.account?.name,
    categoryName,
    subcategoryName,
    tags: t.tags,
  };
}

function CategoryTreemap({ ctTransactions, ctIsBill }) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  // path = [] -> top-level categories.
  // path = [categoryName] -> that category's subcategories, UNLESS it has
  //   few enough that we auto-expand straight to its individual
  //   transactions (see AUTO_EXPAND_SUBCATEGORY_THRESHOLD).
  // path = [categoryName, subcategoryName] -> that one subcategory's
  //   individual transactions (only reachable when NOT auto-expanded).
  const [path, setPath] = useState([]);
  const [entered, setEntered] = useState(false);
  // Transactions are leaves - tapping one doesn't navigate anywhere, so its
  // detail has nowhere persistent to show up on its own. On touch devices
  // there's no hover either, so without this the rich detail (date,
  // account, tags...) would simply be unreachable on mobile. Selecting one
  // shows it in a dedicated panel until dismissed or navigated away from.
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const tilesContainerRef = useRef(null);

  const data = useMemo(
    () => buildCategoryHierarchy(ctTransactions || [], ctIsBill),
    [ctTransactions, ctIsBill]
  );
  const totalValue = useMemo(
    () => (ctTransactions || []).reduce((acc, t) => acc + getPrimaryAmount(t), 0),
    [ctTransactions]
  );

  const topCategories = useMemo(() => data.children || [], [data]);
  const activeCategory = path[0]
    ? topCategories.find((c) => c.name === path[0]) || null
    : null;
  const activeSubcategory =
    activeCategory && path[1] && path[1] !== "__direct__"
      ? (activeCategory.children || []).find((s) => s.name === path[1]) || null
      : null;
  const categoryIsAutoExpanded =
    !!activeCategory && (activeCategory.children || []).length <= AUTO_EXPAND_SUBCATEGORY_THRESHOLD;
  // When auto-expand skipped the subcategory step, the header needs to say
  // so explicitly - otherwise "Restaurant" showing individual transactions
  // looks identical to "Restaurant" showing subcategory tiles, and there's
  // no way to tell which step you're actually on.
  const autoExpandSingleSubcategory =
    categoryIsAutoExpanded &&
    path.length === 1 &&
    (activeCategory.children || []).length === 1 &&
    !(activeCategory.loc > 0)
      ? activeCategory.children[0]
      : null;
  const autoExpandIsMixed =
    categoryIsAutoExpanded &&
    path.length === 1 &&
    !autoExpandSingleSubcategory &&
    (activeCategory.children || []).length >= 1;

  // Full breadcrumb trail for the header - "Food" alone isn't enough once
  // you're inside "Despensa", it has to read "Food › Despensa" so the path
  // back is always visible, not just the current leaf's own name. Every
  // segment except the current (last) one is clickable and jumps straight
  // to that level, instead of only being able to step back one at a time.
  const breadcrumb = useMemo(() => {
    if (path.length === 0 || !activeCategory) return null;
    const second =
      activeSubcategory?.name ||
      (path[1] === "__direct__" ? "Other" : null) ||
      autoExpandSingleSubcategory?.name ||
      null;
    return {
      first: activeCategory.name,
      // A first segment is only a link when there's a second one to go
      // "back" from - explicit drill goes up one level, auto-expand has no
      // intermediate subcategory view to land on so it goes to the root.
      firstClick: second ? (path.length === 2 ? () => setPath([path[0]]) : () => setPath([])) : null,
      second,
    };
  }, [path, activeCategory, activeSubcategory, autoExpandSingleSubcategory]);

  const rootNodes = useMemo(
    () =>
      topCategories
        .map((cat) => ({
          key: cat.name,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          value: cat.loc + (cat.children || []).reduce((a, c) => a + c.loc, 0),
          transactionCount:
            (cat.transactions || []).length + (cat.children || []).reduce((a, c) => a + (c.transactions || []).length, 0),
          hasChildren: (cat.children || []).length > 0 || cat.loc > 0,
          kind: "category",
        }))
        .filter((n) => n.value > 0)
        .sort((a, b) => b.value - a.value),
    [topCategories]
  );

  // Level shown right after drilling into a category: either its
  // subcategories as aggregate tiles, or - if there are only a few - every
  // individual transaction across all of them, flattened into one view.
  const categoryLevelNodes = useMemo(() => {
    if (!activeCategory) return [];
    if (categoryIsAutoExpanded) {
      const direct = (activeCategory.transactions || []).map((t) =>
        transactionNode(t, "direct", activeCategory.color, activeCategory.icon, activeCategory.name)
      );
      const fromSubs = (activeCategory.children || []).flatMap((sub) =>
        (sub.transactions || []).map((t) =>
          transactionNode(t, sub.name, sub.color, sub.icon, activeCategory.name, sub.name)
        )
      );
      return direct.concat(fromSubs).filter((n) => n.value > 0).sort((a, b) => b.value - a.value);
    }
    const subs = (activeCategory.children || []).map((sub) => ({
      key: sub.name,
      name: sub.name,
      color: sub.color,
      icon: sub.icon,
      value: sub.loc,
      transactionCount: (sub.transactions || []).length,
      hasChildren: (sub.transactions || []).length > 0,
      kind: "subcategory",
    }));
    if (activeCategory.loc > 0) {
      subs.push({
        key: "__direct__",
        name: `Other ${activeCategory.name}`,
        color: activeCategory.color,
        icon: activeCategory.icon,
        value: activeCategory.loc,
        transactionCount: (activeCategory.transactions || []).length,
        hasChildren: (activeCategory.transactions || []).length > 0,
        kind: "subcategory",
      });
    }
    return subs.filter((n) => n.value > 0).sort((a, b) => b.value - a.value);
  }, [activeCategory, categoryIsAutoExpanded]);

  // Level shown after explicitly drilling into one specific subcategory
  // (only reachable when the category wasn't auto-expanded above).
  const subcategoryLevelNodes = useMemo(() => {
    if (!activeCategory || !path[1]) return [];
    const bucket =
      path[1] === "__direct__"
        ? { transactions: activeCategory.transactions, color: activeCategory.color, icon: activeCategory.icon, label: "direct", subcategoryName: undefined }
        : activeSubcategory
          ? { transactions: activeSubcategory.transactions, color: activeSubcategory.color, icon: activeSubcategory.icon, label: activeSubcategory.name, subcategoryName: activeSubcategory.name }
          : null;
    if (!bucket) return [];
    return (bucket.transactions || [])
      .map((t) => transactionNode(t, bucket.label, bucket.color, bucket.icon, activeCategory.name, bucket.subcategoryName))
      .filter((n) => n.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeCategory, activeSubcategory, path]);

  const visibleNodes = path.length === 0 ? rootNodes : path.length === 1 ? categoryLevelNodes : subcategoryLevelNodes;
  const rects = useMemo(
    () => squarify(visibleNodes, 0, 0, NOMINAL_W, NOMINAL_H),
    [visibleNodes]
  );
  const headerTotal = visibleNodes.reduce((a, n) => a + n.value, 0);
  // Rolled-up transaction count for whichever category/subcategory we're
  // currently inside - each visible node already carries its own count
  // (transaction-level nodes just count as one each), so summing them
  // gives the parent's total regardless of whether this level is showing
  // subcategory aggregates or a flattened transaction list.
  const headerCount = visibleNodes.reduce(
    (a, n) => a + (n.kind === "transaction" ? 1 : n.transactionCount || 0),
    0
  );
  const headerPct = totalValue > 0 ? ((headerTotal / totalValue) * 100).toFixed(1) : "0.0";

  // Re-triggers the tiles' pop-in animation every time the visible set
  // changes (drilling in/out, or switching Bills <-> Incomes tabs).
  useEffect(() => {
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [visibleNodes]);

  // A stale selected-transaction detail from a previous level shouldn't
  // linger once you've navigated elsewhere.
  useEffect(() => {
    setSelectedTransaction(null);
  }, [path]);

  const handleTileClick = (node) => {
    if (node.kind === "transaction") {
      setSelectedTransaction((prev) => (prev?.key === node.key ? null : node));
      return;
    }
    if (!node.hasChildren) return;
    if (node.kind === "category") setPath([node.name]);
    else if (node.kind === "subcategory") setPath((prev) => [prev[0], node.name]);
  };
  const handleChipClick = (cat) => {
    if (!(cat.children || []).length && !(cat.loc > 0)) return;
    setPath((prev) => (prev[0] === cat.name ? [] : [cat.name]));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="CategoryTreemap-Content-title pt-5">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Category {ctIsBill ? "Bills" : "Incomes"} Details
        </h1>
      </div>
      <div className="w-full px-3 sm:px-6 pt-4 pb-6">
        <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              {path.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPath((prev) => prev.slice(0, -1))}
                  aria-label="Back one level"
                  className="text-slate-400 hover:text-purple-600 transition-colors text-xl leading-none px-1"
                >
                  ‹
                </button>
              )}
              <div className="min-w-0 flex flex-col">
                <h2 className="text-slate-800 font-bold text-lg leading-tight truncate">
                  {!breadcrumb ? (
                    `Category ${ctIsBill ? "Bills" : "Incomes"}`
                  ) : (
                    <>
                      <span
                        onClick={breadcrumb.firstClick || undefined}
                        className={breadcrumb.firstClick ? "cursor-pointer hover:text-purple-600 transition-colors" : ""}
                      >
                        {breadcrumb.first}
                      </span>
                      {breadcrumb.second && (
                        <>
                          {" "}
                          <span className="text-slate-300 font-normal">›</span> {breadcrumb.second}
                        </>
                      )}
                      {!breadcrumb.second && autoExpandIsMixed && (
                        <span className="text-slate-400 font-normal text-sm"> · Transacciones</span>
                      )}
                    </>
                  )}
                </h2>
                {/* Same info the hover tooltip shows, but always visible -
                    hover doesn't exist on touch devices, so this is the only
                    way mobile users ever see a category/subcategory's own
                    transaction count and share of the total. */}
                {path.length > 0 && (
                  <span className="text-slate-400 text-xs leading-tight">
                    {headerCount} transaccion{headerCount === 1 ? "" : "es"} · {headerPct}% del total
                  </span>
                )}
              </div>
            </div>
            <div className="text-slate-500 text-sm shrink-0 pl-2">
              Total:{" "}
              <span className="text-slate-800 font-bold">
                {formatMoneyMajor(headerTotal, walletPrimaryCurrency)}
              </span>
            </div>
          </div>

          {/* Persistent detail for a tapped transaction - transactions are
              leaves (tapping doesn't navigate anywhere), and on mobile
              there's no hover to fall back on, so without this the full
              detail (date/account/category/tags) would be unreachable. */}
          {selectedTransaction && (
            <div className="mx-5 mb-3 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span
                className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-white shrink-0"
                style={{ backgroundColor: selectedTransaction.color || "#8884d8" }}
              >
                <UniversalCategoIcon type={selectedTransaction.icon} siz={19} colore="#fff" />
              </span>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-800 font-bold text-sm truncate">{selectedTransaction.name}</span>
                  <span className="text-slate-800 font-bold text-sm shrink-0">
                    {formatMoneyMajor(selectedTransaction.value, walletPrimaryCurrency)}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">
                  {selectedTransaction.date && dayjs(selectedTransaction.date).format("DD/MM/YYYY")}
                  {selectedTransaction.accountName ? ` · Cuenta: ${selectedTransaction.accountName}` : ""}
                </span>
                {(selectedTransaction.categoryName || selectedTransaction.subcategoryName) && (
                  <span className="text-slate-500 text-xs">
                    {selectedTransaction.categoryName}
                    {selectedTransaction.subcategoryName ? ` · ${selectedTransaction.subcategoryName}` : ""}
                  </span>
                )}
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <span className="text-slate-400 text-xs">
                    {selectedTransaction.tags.map((tag) => tag.name).filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="text-slate-400 text-xs">
                  {totalValue > 0 ? ((selectedTransaction.value / totalValue) * 100).toFixed(1) : "0.0"}% del total
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close transaction detail"
                className="text-slate-400 hover:text-purple-600 transition-colors text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          )}

          <div
            ref={tilesContainerRef}
            className="relative w-full px-4 aspect-[4/3] sm:aspect-[2/1] md:aspect-[12/5]"
          >
            {rects.map((r, i) => (
              <TreemapTile
                key={r.node.key}
                rect={r}
                index={i}
                isBig={r.width >= BIG_TILE_MIN_W && r.height >= BIG_TILE_MIN_H}
                canDrill={r.node.hasChildren || r.node.kind === "transaction"}
                isSelected={selectedTransaction?.key === r.node.key}
                pct={totalValue > 0 ? ((r.node.value / totalValue) * 100).toFixed(1) : "0.0"}
                currency={walletPrimaryCurrency}
                onClick={() => handleTileClick(r.node)}
                entered={entered}
                containerRef={tilesContainerRef}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center px-5 py-5">
            {topCategories.map((cat) => {
              const isActive = path[0] === cat.name;
              const total = cat.loc + (cat.children || []).reduce((a, c) => a + c.loc, 0);
              const count =
                (cat.transactions || []).length + (cat.children || []).reduce((a, c) => a + (c.transactions || []).length, 0);
              const pct = totalValue > 0 ? ((total / totalValue) * 100).toFixed(1) : "0.0";
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleChipClick(cat)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
                  }`}
                >
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: cat.color || "#ABABAB" }}
                  >
                    <UniversalCategoIcon type={cat.icon} siz={11} />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="flex items-center gap-1">
                      {cat.name}
                      <span className="text-slate-400 font-normal">
                        {formatMoneyMajor(total, walletPrimaryCurrency)}
                      </span>
                    </span>
                    <span className="text-slate-400 font-normal text-[10px]">
                      {count} txn{count === 1 ? "" : "s"} · {pct}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryTreemap;
