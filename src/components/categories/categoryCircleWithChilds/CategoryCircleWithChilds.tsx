"use client";
import React from "react";
import CategoryCircle, { type CategoryFatherLike } from "../categoryCircle/CategoryCircle";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { Tooltip } from "antd";
import { FaRegQuestionCircle } from "react-icons/fa";
import { useT } from "@/i18n/client";

export interface SubCategoryItem {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string | null;
  fatherCategory?: CategoryFatherLike | null | unknown;
  [key: string]: unknown;
}

export interface CategoryCircleWithChildsProps<T = unknown> {
  size?: number | string;
  category?: T;
  color?: string;
  name?: string;
  icon?: string;
  onSelect?: (category?: unknown) => void;
  childs?: (SubCategoryItem | unknown)[] | null;
}

function CategoryCircleWithChilds<T = unknown>({
  size,
  category,
  name,
  icon,
  onSelect,
  childs,
}: CategoryCircleWithChildsProps<T>): React.JSX.Element {
  const t = useT();
  return (
    <div className="father-container flex flex-col justify-start items-center gap-2">
      <span
        className="w-full text-4xl text-purple-300 hover:underline cursor-pointer flex justify-center items-center gap-2"
        onClick={() => onSelect(category)}
      >
        <UniversalCategoIcon type={icon} />
        <h1>{name}</h1>
        <Tooltip title={t("categories.tipFather")}>
          <FaRegQuestionCircle size={25}/>
        </Tooltip>
      </span>
      <p className="text-sm font-semibold text-purple-300">
        {t("categories.subs.title", { p1: name })}
      </p>
      <div className="childs-container flex justify-center items-center gap-2 flex-wrap">
        {!childs ? (
          <p>{t("categories.subs.none")} 🤷</p>
        ) : (
          (childs as SubCategoryItem[]).map((sub) => (
            <CategoryCircle
              size={size || 50}
              category={sub}
              color={sub?.color}
              name={sub.name}
              icon={sub?.icon}
              father={sub?.fatherCategory || null}
              onSelect={onSelect}
              key={`cat-circle-childs-${sub._id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryCircleWithChilds;
