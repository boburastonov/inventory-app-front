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

import api from "../api/axios";
import { useAuthStore } from "../store/auth.store";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isBlocked: boolean;
  emailVerified: boolean;
  createdAt: string;
  googleId: string | null;
  _count: { inventories: number };
}

const AdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();

  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (!me?.isAdmin) {
      navigate("/");
      return;
    }
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [me]);

  const handleBlock = async (id: string, isBlocked: boolean) => {
    const url = isBlocked
      ? `/admin/users/${id}/unblock`
      : `/admin/users/${id}/block`;
    const res = await api.patch(url);
    setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
  };

  const handleSetAdmin = async (id: string, isAdmin: boolean) => {
    const url = isAdmin
      ? `/admin/users/${id}/remove-admin`
      : `/admin/users/${id}/make-admin`;
    const res = await api.patch(url);
    setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("inventory.deleteConfirm"))) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: t("admin.userName"),
      cell: (info) => (
        <span
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/profile/${info.row.original.id}`)}
        >
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: t("admin.userEmail"),
      cell: (info) => (
        <span className="text-muted small">{info.getValue() as string}</span>
      ),
    },
    {
      id: "status",
      header: t("admin.userStatus"),
      cell: (info) => {
        const u = info.row.original;
        return (
          <div className="d-flex gap-1 flex-wrap">
            <span
              className={`badge ${u.isBlocked ? "bg-danger" : "bg-success"}`}
            >
              {u.isBlocked ? t("admin.blocked") : t("admin.active")}
            </span>
            {u.isAdmin && (
              <span className="badge bg-warning text-dark">
                {t("admin.admin")}
              </span>
            )}
            {u.googleId && <span className="badge bg-secondary">Google</span>}
            {!u.emailVerified && (
              <span className="badge bg-light text-dark">Unverified</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "_count.inventories",
      header: "Inventories",
      cell: (info) => (
        <span className="badge bg-secondary">{info.getValue() as number}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (info) => {
        const u = info.row.original;
        const isSelf = u.id === me?.id;
        return (
          <div className="d-flex gap-1 justify-content-end flex-wrap">
            {!isSelf && (
              <button
                className={`btn btn-sm ${u.isBlocked ? "btn-outline-success" : "btn-outline-warning"}`}
                onClick={() => handleBlock(u.id, u.isBlocked)}
              >
                {u.isBlocked ? t("admin.unblock") : t("admin.block")}
              </button>
            )}
            <button
              className={`btn btn-sm ${u.isAdmin ? "btn-outline-secondary" : "btn-outline-primary"}`}
              onClick={() => handleSetAdmin(u.id, u.isAdmin)}
            >
              {u.isAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
            </button>
            {!isSelf && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(u.id)}
              >
                🗑
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold mb-3">{t("admin.title")}</h5>

      <input
        className="form-control form-control-sm mb-3"
        style={{ maxWidth: "280px" }}
        placeholder={t("navbar.search")}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

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
                    className={
                      header.id === "email" ? "d-none d-md-table-cell" : ""
                    }
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
                  {t("search.noResults")}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "email"
                          ? "d-none d-md-table-cell"
                          : ""
                      }
                    >
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

export default AdminPage;
