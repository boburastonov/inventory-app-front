import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import api from "../api/axios";

interface Inventory {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { items: number };
  tags: { tag: { id: number; name: string } }[];
}

interface Tag {
  id: number;
  name: string;
}

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [top, setTop] = useState<Inventory[]>([]);
  const [latest, setLatest] = useState<Inventory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latestRes, topRes, tagsRes] = await Promise.all([
          api.get("/inventories/latest"),
          api.get("/inventories/top"),
          api.get("/inventories/tags/search?q="),
        ]);
        setLatest(latestRes.data);
        setTop(topRes.data);
        setTags(tagsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h5 className="fw-bold mb-3">{t("home.latestInventories")}</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{t("inventory.title")}</th>
                <th className="d-none d-md-table-cell">
                  {t("inventory.description")}
                </th>
                <th className="d-none d-sm-table-cell">{t("home.creator")}</th>
                <th>{t("home.itemCount")}</th>
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-3">
                    {t("profile.noInventories")}
                  </td>
                </tr>
              ) : (
                latest.map((inv) => (
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
                    <td className="d-none d-sm-table-cell">
                      <Link
                        to={`/profile/${inv.owner.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-decoration-none"
                      >
                        {inv.owner.name}
                      </Link>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {inv._count.items}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <h5 className="fw-bold mb-3">{t("home.topInventories")}</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>{t("inventory.title")}</th>
                <th className="d-none d-sm-table-cell">{t("home.creator")}</th>
                <th>{t("home.itemCount")}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((inv, i) => (
                <tr
                  key={inv.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/inventories/${inv.id}`)}
                >
                  <td className="text-muted">{i + 1}</td>
                  <td className="fw-medium">{inv.title}</td>
                  <td className="d-none d-sm-table-cell">
                    <Link
                      to={`/profile/${inv.owner.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-decoration-none"
                    >
                      {inv.owner.name}
                    </Link>
                  </td>
                  <td>
                    <span className="badge bg-primary">{inv._count.items}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <h5 className="fw-bold mb-3">{t("home.tagCloud")}</h5>
        {tags.length === 0 ? (
          <p className="text-muted">{t("search.noResults")}</p>
        ) : (
          <div className="d-flex flex-wrap gap-2 tag-cloud">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="badge rounded-pill bg-primary-subtle text-primary-emphasis fs-6"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/search?tag=${encodeURIComponent(tag.name)}`)
                }
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
