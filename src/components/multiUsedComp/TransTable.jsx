import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

function TransTable({ dataTable }) {
  let [data, setData] = useState([])
  useEffect(() => {
    setData(dataTable)
  }, [dataTable])
  const columns = [
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Amount",
      accessorKey: "amount",
    },
  ];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>{header.column.columnDef.header}</th>
                ))}
              </tr>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {console.log(cell)}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransTable;
