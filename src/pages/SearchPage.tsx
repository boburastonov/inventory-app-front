import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";

import api from "../api/axios";

interface InventoryResult {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  ownerName: string;
  ownerId: string;
}

interface ItemResult {
  id: string;
  customId: string;
  inventoryId: string;
  inventoryTitle: string;
}

const SearchPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemResult[]>([]);
  const [inventories, setInventories] = useState<InventoryResult[]>([]);

  useEffect(() => {
    if (!query && !tag) return;
    setLoading(true);

    const fetch = tag
      ? api
          .get(`/inventories/by-tag/${encodeURIComponent(tag)}`)
          .then((res) => {
            setInventories(res.data);
            setItems([]);
          })
      : api.get(`/search?q=${encodeURIComponent(query)}`).then((res) => {
          setInventories(res.data.inventories);
          setItems(res.data.items);
        });

    fetch.finally(() => setLoading(false));
  }, [query, tag]);

  const total = inventories.length + items.length;

  return (
    <div>
      <div className="mb-4">
        <h5 className="fw-bold">{t("search.title")}</h5>
        <p className="text-muted">
          {tag ? `#${tag}` : `"${query}"`} —{" "}
          {t(total === 1 ? "search.results" : "search.results_other", {
            count: total,
          })}
        </p>
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-4">
          <div className="spinner-border text-primary" />
        </div>
      )}

      {!loading && total === 0 && (
        <div className="text-center text-muted py-5">
          <p className="fs-5">🔍</p>
          <p>{t("search.noResults")}</p>
        </div>
      )}

      {inventories.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">Inventories ({inventories.length})</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>{t("inventory.title")}</th>
                  <th className="d-none d-md-table-cell">
                    {t("inventory.description")}
                  </th>
                  <th className="d-none d-sm-table-cell">
                    {t("home.creator")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventories.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/inventories/${inv.id}`)}
                  >
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {inv.imageUrl && (
                          <img
                            src={inv.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded object-fit-cover"
                          />
                        )}
                        <span className="fw-medium">{inv.title}</span>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell text-muted small">
                      {inv.description
                        ? inv.description.slice(0, 80) +
                          (inv.description.length > 80 ? "..." : "")
                        : "—"}
                    </td>
                    <td className="d-none d-sm-table-cell text-muted">
                      {inv.ownerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h6 className="fw-bold mb-2">Items ({items.length})</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>{t("items.customId")}</th>
                  <th>{t("inventory.title")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(
                        `/inventories/${item.inventoryId}/items/${item.id}`,
                      )
                    }
                  >
                    <td>
                      <code>{item.customId}</code>
                    </td>
                    <td className="text-muted">{item.inventoryTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
