import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../../api/axios";

interface Stats {
  totalItems: number;
  numericStats: {
    field: { id: string; title: string };
    min: number | null;
    max: number | null;
    avg: number | null;
  }[];
  stringStats: {
    field: { id: string; title: string };
    topValues: { value: string | null; count: number }[];
  }[];
}

const StatsTab = ({ inventoryId }: { inventoryId: string }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/inventories/${inventoryId}/stats`)
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, [inventoryId]);

  if (loading) return <div className="spinner-border text-primary" />;
  if (!stats) return null;

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="card border-0 bg-primary-subtle">
          <div className="card-body text-center">
            <h2 className="mb-0">{stats.totalItems}</h2>
            <small className="text-muted">
              {t("inventory.stats.totalItems")}
            </small>
          </div>
        </div>
      </div>

      {stats.numericStats.length > 0 && (
        <div className="col-12">
          <h6 className="fw-bold">{t("fields.types.NUMBER")}</h6>
          <div className="row g-2">
            {stats.numericStats.map((s) => (
              <div key={s.field.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-title">{s.field.title}</h6>
                    <div className="d-flex justify-content-between">
                      <div className="text-center">
                        <div className="fw-bold">{s.min ?? "—"}</div>
                        <small className="text-muted">min</small>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold text-primary">
                          {s.avg != null ? s.avg.toFixed(2) : "—"}
                        </div>
                        <small className="text-muted">
                          {t("inventory.stats.numericAvg")}
                        </small>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold">{s.max ?? "—"}</div>
                        <small className="text-muted">max</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.stringStats.length > 0 && (
        <div className="col-12">
          <h6 className="fw-bold">{t("inventory.stats.topValues")}</h6>
          <div className="row g-2">
            {stats.stringStats.map((s) => (
              <div key={s.field.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-title">{s.field.title}</h6>
                    {s.topValues.map((v, i) => (
                      <div
                        key={i}
                        className="d-flex justify-content-between small"
                      >
                        <span className="text-truncate me-2">
                          {v.value ?? "—"}
                        </span>
                        <span className="badge bg-secondary">{v.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;
