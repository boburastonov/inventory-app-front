import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import api from "../../api/axios";
import type { Inventory } from "../../pages/InventoryPage";

interface Item {
  id: string;
  customId: string;
  createdAt: string;
  values: {
    field: { id: string; title: string; showInTable: boolean };
    value: string | null;
  }[];
  _count: { likes: number };
}

const ItemsTab = ({
  inventory,
  hasWriteAccess,
}: {
  inventory: Inventory;
  hasWriteAccess: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tableFields = inventory.fields.filter((f) => f.showInTable);

  useEffect(() => {
    api
      .get(`/inventories/${inventory.id}/items`)
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, [inventory.id]);

  const handleDelete = async (ids: string[]) => {
    if (!confirm(t("items.deleteConfirm"))) return;
    await Promise.all(
      ids.map((id) => api.delete(`/inventories/${inventory.id}/items/${id}`)),
    );
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  };

  const columns: ColumnDef<Item>[] = [
    ...(hasWriteAccess
      ? [
          {
            id: "select",
            header: () => (
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={toggleAll}
              />
            ),
            cell: (info: any) => (
              <input
                type="checkbox"
                checked={selected.has(info.row.original.id)}
                onChange={() => toggleSelect(info.row.original.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ),
          } as ColumnDef<Item>,
        ]
      : []),
    {
      accessorKey: "customId",
      header: t("items.customId"),
      cell: (info) => <code>{info.getValue() as string}</code>,
    },
    ...tableFields.map(
      (field) =>
        ({
          id: field.id,
          header: field.title,
          cell: (info: any) => {
            const val = info.row.original.values.find(
              (v: any) => v.field.id === field.id,
            )?.value;
            if (field.fieldType === "BOOLEAN") {
              return val === "true" ? "✅" : "☐";
            }
            return val ?? "—";
          },
        }) as ColumnDef<Item>,
    ),
    {
      accessorKey: "_count.likes",
      header: "❤️",
      cell: (info) => (
        <span className="text-muted small">{info.getValue() as number}</span>
      ),
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: "250px" }}
          placeholder={t("navbar.search")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="d-flex gap-2">
          {hasWriteAccess && selected.size > 0 && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(Array.from(selected))}
            >
              {t("common.delete")} ({selected.size})
            </button>
          )}
          {hasWriteAccess && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate(`/inventories/${inventory.id}/items/new`)}
            >
              + {t("items.addItem")}
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      cursor: header.column.getCanSort()
                        ? "pointer"
                        : "default",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "asc"
                      ? " ↑"
                      : header.column.getIsSorted() === "desc"
                        ? " ↓"
                        : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-muted py-4"
                >
                  {t("items.noItems")}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/inventories/${inventory.id}/items/${row.original.id}`,
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTab;
