"use client";
import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";
import CreditCard from "./CreditCard";
import randomColor from "randomcolor";
import { Skeleton } from "antd";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import fetcher from "@/helpers/fetcher";

function SortableCard({ account, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function MultiCreditCard({ acc, user, trans, mccSession, walletPrimaryCurrency, mail }) {
  let [userName, setUserName] = useState("");
  let [allTransactions, setAllTransactions] = useState([]);
  let [accounts, setAccounts] = useState([]);
  let [cardColors, setCardColors] = useState({});
  const toFetch = fetcher();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (user && acc.length > 0 && trans.length > 0) {
      setUserName(user.fullName || user);
      setAllTransactions(trans);
      setAccounts(acc);
      // Colors stay attached to the account itself (by id), not to its
      // position - otherwise every drag reorder would scramble them.
      setCardColors((prev) => {
        const next = { ...prev };
        acc.forEach((a, index) => {
          if (!next[a._id]) next[a._id] = generateColors(index);
        });
        return next;
      });
    }
  }, [user, acc, trans]);

  const generateColors = (index) => {
    if (index === 0)
      return "linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(18,127,205,1) 100%)";
    if (index === 1)
      return "linear-gradient(90deg, rgba(190,17,210,1) 0%, rgba(210,17,17,1) 100%)";
    if (index === 2)
      return "linear-gradient(90deg, rgba(180,58,58,1) 0%, rgba(205,129,18,1) 100%)";
    if (index === 3)
      return "linear-gradient(90deg, rgba(58,59,180,1) 0%, rgba(17,162,210,1) 100%)";
    if (index >= 4) {
      const color1 = randomColor();
      const color2 = randomColor();
      return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = accounts.findIndex((a) => a._id === active.id);
    const newIndex = accounts.findIndex((a) => a._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(accounts, oldIndex, newIndex);
    setAccounts(reordered);
    if (mail) {
      toFetch
        .post("general-data/accounts/reorder", {
          mail,
          orderedIds: reordered.map((a) => a._id),
        })
        .catch(() => {
          // Best-effort persistence - the visual order still updates even
          // if the save fails, next refresh will just fall back to the
          // last successfully saved order.
        });
    }
  };

  return (
    <div className="w-full overflow-x-hidden flex flex-col">
      <div className="header text-center">
        <h1 className="movement-title text-black text-2xl text-center font-bold py-4">
          Accounts resume
        </h1>
      </div>
      <div className="flex flex-row pb-6 px-1 overflow-x-scroll">
        {accounts && accounts.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={accounts.map((a) => a._id)} strategy={horizontalListSortingStrategy}>
              {accounts.map((ac) => (
                <SortableCard key={ac._id} account={ac}>
                  <CreditCard
                    acc={ac}
                    user={userName}
                    trans={allTransactions}
                    cardColor={cardColors[ac._id]}
                    walletPrimaryCurrency={walletPrimaryCurrency}
                    current
                  />
                </SortableCard>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="w-[80%]">
            <Skeleton active />
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiCreditCard;
