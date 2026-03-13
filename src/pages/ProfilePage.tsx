// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
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

interface Inventory {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: { items: number };
  owner?: { id: string; name: string };
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  _count: { inventories: number };
}

const InventoryTable = ({
  data,
  showOwner = false,
  onDelete,
}: {
  data: Inventory[];
  showOwner?: boolean;
  onDelete?: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "title",
      header: t("inventory.title"),
      cell: (info) => (
        <span className="fw-medium">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: "description",
      header: t("inventory.description"),
      cell: (info) => {
        const val = info.getValue() as string | null;
        return (
          <span className="text-muted small">
            {val ? val.slice(0, 60) + (val.length > 60 ? "..." : "") : "—"}
          </span>
        );
      },
    },
    ...(showOwner
      ? [
          {
            accessorKey: "owner.name",
            header: t("home.creator"),
            cell: (info: any) => info.row.original.owner?.name ?? "—",
          } as ColumnDef<Inventory>,
        ]
      : []),
    {
      accessorKey: "_count.items",
      header: t("home.itemCount"),
      cell: (info) => (
        <span className="badge bg-secondary">{info.getValue() as number}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (info) =>
        onDelete ? (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(info.row.original.id);
            }}
          >
            {t("common.delete")}
          </button>
        ) : null,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <input
        className="form-control form-control-sm mb-2"
        placeholder={t("navbar.search")}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        style={{ maxWidth: "250px" }}
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
                  className="text-center text-muted py-3"
                >
                  {t("profile.noInventories")}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/inventories/${row.original.id}`)}
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

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();
  const { userId } = useParams<{ userId: string }>();

  const [loading, setLoading] = useState(true);
  const [accessible, setAccessible] = useState<Inventory[]>([]);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [myInventories, setMyInventories] = useState<Inventory[]>([]);

  const isOwn = me?.id === userId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes] = await Promise.all([api.get(`/users/${userId}`)]);
        setProfile(profileRes.data);

        if (isOwn) {
          const [myRes, accessRes] = await Promise.all([
            api.get("/inventories/my"),
            api.get("/inventories/accessible"),
          ]);
          setMyInventories(myRes.data);
          setAccessible(accessRes.data);
        }
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleCreate = async () => {
    try {
      const res = await api.post("/inventories", { title: "New Inventory" });
      navigate(`/inventories/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("inventory.deleteConfirm"))) return;
    try {
      await api.delete(`/inventories/${id}`);
      setMyInventories((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-3">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={72}
                  height={72}
                  className="rounded-circle"
                />
              ) : (
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fs-3"
                  style={{ width: 72, height: 72 }}
                >
                  {profile.name[0].toUpperCase()}
                </div>
              )}
              <div className="text-center text-sm-start">
                <h4 className="mb-1">{profile.name}</h4>
                <p className="text-muted mb-1">{profile.email}</p>
                <small className="text-muted">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOwn && (
        <div className="col-12">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
            <h5 className="fw-bold mb-0">{t("profile.myInventories")}</h5>
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>
              + {t("profile.createInventory")}
            </button>
          </div>
          <InventoryTable data={myInventories} onDelete={handleDelete} />
        </div>
      )}

      {isOwn && (
        <div className="col-12">
          <h5 className="fw-bold mb-3">{t("profile.accessibleInventories")}</h5>
          <InventoryTable data={accessible} showOwner />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
