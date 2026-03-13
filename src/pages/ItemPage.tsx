import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";

import api from "../api/axios";
import { useAuthStore } from "../store/auth.store";

interface Field {
  id: string;
  title: string;
  description: string | null;
  fieldType: "TEXT_SINGLE" | "TEXT_MULTI" | "NUMBER" | "BOOLEAN" | "LINK";
}

interface ItemValue {
  field: Field;
  value: string | null;
}

interface Item {
  id: string;
  customId: string;
  version: number;
  createdAt: string;
  createdById: string;
  inventory: { id: string; title: string; ownerId: string; fields: Field[] };
  values: ItemValue[];
  _count: { likes: number };
}

interface LikeStatus {
  liked: boolean;
  count: number;
}

const ItemPage = () => {
  const { t } = useTranslation();
  const { inventoryId, itemId } = useParams<{
    inventoryId: string;
    itemId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customId, setCustomId] = useState("");
  const [editing, setEditing] = useState(itemId === "new");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({
    liked: false,
    count: 0,
  });

  const isNew = itemId === "new";

  const isOwner = user?.id === item?.inventory.ownerId;
  const isAdmin = user?.isAdmin;
  const hasWriteAccess = isOwner || isAdmin;

  useEffect(() => {
    if (isNew) {
      api
        .get(`/inventories/${inventoryId}`)
        .then((res) => {
          setItem({
            id: "",
            customId: "",
            version: 0,
            createdAt: "",
            createdById: "",
            inventory: res.data,
            values: [],
            _count: { likes: 0 },
          });
        })
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([
      api.get(`/inventories/${inventoryId}/items/${itemId}`),
      user
        ? api.get(`/inventories/${inventoryId}/items/${itemId}/like`)
        : Promise.resolve({ data: { liked: false, count: 0 } }),
    ])
      .then(([itemRes, likeRes]) => {
        const data = itemRes.data;
        setItem(data);
        setCustomId(data.customId);
        const vals: Record<string, string> = {};
        data.values.forEach((v: ItemValue) => {
          vals[v.field.id] = v.value ?? "";
        });
        setFieldValues(vals);
        setLikeStatus(likeRes.data);
      })
      .finally(() => setLoading(false));
  }, [itemId, inventoryId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const res = await api.post(`/inventories/${inventoryId}/items`, {
          fieldValues,
        });
        navigate(`/inventories/${inventoryId}/items/${res.data.id}`, {
          replace: true,
        });
      } else {
        const res = await api.patch(
          `/inventories/${inventoryId}/items/${itemId}`,
          {
            version: item!.version,
            customId,
            fieldValues,
          },
        );
        setItem(res.data);
        setEditing(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === "versionConflict") setError(t("errors.versionConflict"));
      else if (msg === "duplicateId") setError(t("errors.duplicateId"));
      else setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("items.deleteConfirm"))) return;
    await api.delete(`/inventories/${inventoryId}/items/${itemId}`);
    navigate(`/inventories/${inventoryId}`);
  };

  const handleLike = async () => {
    if (!user) return navigate("/login");
    if (likeStatus.liked) {
      await api.delete(`/inventories/${inventoryId}/items/${itemId}/like`);
      setLikeStatus((prev) => ({ liked: false, count: prev.count - 1 }));
    } else {
      await api.post(`/inventories/${inventoryId}/items/${itemId}/like`);
      setLikeStatus((prev) => ({ liked: true, count: prev.count + 1 }));
    }
  };

  const renderField = (field: Field) => {
    const value = fieldValues[field.id] ?? "";

    if (!editing) {
      if (field.fieldType === "BOOLEAN") return value === "true" ? "✅" : "☐";
      if (field.fieldType === "LINK")
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          "—"
        );
      if (field.fieldType === "TEXT_MULTI")
        return <ReactMarkdown>{value || "—"}</ReactMarkdown>;
      return value || "—";
    }

    const onChange = (val: string) =>
      setFieldValues((prev) => ({ ...prev, [field.id]: val }));

    switch (field.fieldType) {
      case "TEXT_SINGLE":
        return (
          <input
            className="form-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title={field.description ?? ""}
          />
        );
      case "TEXT_MULTI":
        return (
          <textarea
            className="form-control"
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title={field.description ?? ""}
          />
        );
      case "NUMBER":
        return (
          <input
            type="number"
            className="form-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title={field.description ?? ""}
          />
        );
      case "BOOLEAN":
        return (
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "false")}
              title={field.description ?? ""}
            />
          </div>
        );
      case "LINK":
        return (
          <input
            type="url"
            className="form-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            title={field.description ?? ""}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <span
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/inventories/${inventoryId}`)}
              >
                {item.inventory.title}
              </span>
            </li>
            <li className="breadcrumb-item active">
              {isNew ? t("items.addItem") : item.customId}
            </li>
          </ol>
        </nav>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-4">
              <div>
                {!isNew && (
                  <h5 className="mb-1">
                    <code>{item.customId}</code>
                  </h5>
                )}
                {!isNew && (
                  <small className="text-muted">
                    {t("items.createdAt")}:{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </small>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {!isNew && !editing && (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleLike}
                  >
                    {likeStatus.liked ? "❤️" : "🤍"} {likeStatus.count}
                  </button>
                )}
                {hasWriteAccess && !isNew && !editing && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ {t("common.edit")}
                  </button>
                )}
                {hasWriteAccess && !isNew && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleDelete}
                  >
                    🗑 {t("common.delete")}
                  </button>
                )}
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {editing && !isNew && (
              <div className="mb-3">
                <label className="form-label fw-medium">
                  {t("items.customId")}
                </label>
                <input
                  className="form-control"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                />
              </div>
            )}

            <div className="row g-3">
              {item.inventory.fields.map((field) => (
                <div key={field.id} className="col-12 col-sm-6">
                  <label className="form-label fw-medium">
                    {field.title}
                    {field.description && (
                      <span
                        className="ms-1 text-muted"
                        title={field.description}
                        style={{ cursor: "help" }}
                      >
                        ⓘ
                      </span>
                    )}
                  </label>
                  <div>{renderField(field)}</div>
                </div>
              ))}
            </div>

            {editing && (
              <div className="d-flex gap-2 mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t("common.loading") : t("common.save")}
                </button>
                {!isNew && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setEditing(false)}
                  >
                    {t("common.cancel")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemPage;
