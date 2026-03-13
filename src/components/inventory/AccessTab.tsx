import { useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../../api/axios";
import type { Inventory } from "../../pages/InventoryPage";

interface UserSuggestion {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

type SortKey = "name" | "email";

const AccessTab = ({
  inventory,
  onUpdate,
}: {
  inventory: Inventory;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);

  const sortedAccesses = [...inventory.accesses].sort((a, b) =>
    a.user[sortKey].localeCompare(b.user[sortKey]),
  );

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await api.get(`/search/users?q=${encodeURIComponent(val)}`);
    const existing = new Set(inventory.accesses.map((a) => a.user.id));
    setSuggestions(res.data.filter((u: UserSuggestion) => !existing.has(u.id)));
  };

  const handleAdd = async (user: UserSuggestion) => {
    setLoading(true);
    try {
      await api.post(`/inventories/${inventory.id}/access`, {
        userId: user.id,
      });
      onUpdate();
      setQuery("");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    await api.delete(`/inventories/${inventory.id}/access/${userId}`);
    onUpdate();
  };

  return (
    <div className="row">
      <div className="col-12 col-lg-8">
        <h6 className="fw-bold mb-3">{t("inventory.access.title")}</h6>

        <div className="mb-3 position-relative">
          <label className="form-label">{t("inventory.access.addUser")}</label>
          <input
            className="form-control"
            placeholder="Name or email..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul
              className="list-group position-absolute w-100"
              style={{ zIndex: 100, top: "100%" }}
            >
              {suggestions.map((u) => (
                <li
                  key={u.id}
                  className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleAdd(u)}
                >
                  <div>
                    <div className="fw-medium">{u.name}</div>
                    <small className="text-muted">{u.email}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn btn-sm ${sortKey === "name" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setSortKey("name")}
          >
            {t("inventory.access.sortByName")}
          </button>
          <button
            className={`btn btn-sm ${sortKey === "email" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setSortKey("email")}
          >
            {t("inventory.access.sortByEmail")}
          </button>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>{t("admin.userName")}</th>
                <th className="d-none d-sm-table-cell">
                  {t("admin.userEmail")}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedAccesses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-3">
                    —
                  </td>
                </tr>
              ) : (
                sortedAccesses.map(({ user }) => (
                  <tr key={user.id}>
                    <td className="fw-medium">{user.name}</td>
                    <td className="d-none d-sm-table-cell text-muted">
                      {user.email}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemove(user.id)}
                        disabled={loading}
                      >
                        {t("inventory.access.removeUser")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccessTab;
