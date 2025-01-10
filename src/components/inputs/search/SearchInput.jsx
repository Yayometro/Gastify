function SearchInput({ onChange, renderBtn, style }) {
  return (
    <div
      className={
        style ||
        "w-full max-w-[500px] border-[1px] border-purple-600 py-2 px-2 rounded-3xl flex justify-between items-center"
      }
    >
      <p className="text-xs text-purple-700 hover:text-purple-500 pr-2">Search</p>
      <input
        type="search"
        style={{
          all: "unset", // Elimina todos los estilos predeterminados
          flex: 1, // Permite que el input ocupe todo el espacio disponible
          textAlign: "start",
        }}
        onChange={onChange}
      />
      {renderBtn}
    </div>
  );
}

export default SearchInput;
