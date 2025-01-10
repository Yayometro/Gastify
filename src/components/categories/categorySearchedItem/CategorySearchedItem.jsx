import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";

function CategorySearchedItem({ style, category, name, icon, onSelect, size }) {
  return (
    <div
      className={
        style ||
        "w-full h-full max-h-[30px] bg-slate-200 rounded-md flex gap-2 justify-start items-center hover:bg-slate-300 cursor-pointer py-1 px-2 max-w-[500px]"
      }
      onClick={() => onSelect(category)}
    >
      <UniversalCategoIcon type={icon} siz={size || 30} />
      <h1>{name}</h1>
    </div>
  );
}

export default CategorySearchedItem;
