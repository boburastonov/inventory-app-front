import { useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";

import api from "../../api/axios";
import type { Inventory } from "../../pages/InventoryPage";

interface Category {
  id: number;
  name: string;
}

const SettingsTab = ({
  inventory,
  onUpdate,
}: {
  inventory: Inventory;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [title, setTitle] = useState(inventory.title);
  const [description, setDescription] = useState(inventory.description ?? "");
  const [isPublic, setIsPublic] = useState(inventory.isPublic);
  const [categoryId, setCategoryId] = useState<number | "">(
    inventory.category?.id ?? "",
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(inventory.tags.map((t) => t.tag.name));
  const [tagSuggestions, setTagSuggestions] = useState<
    { id: number; name: string }[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [version, setVersion] = useState(inventory.version);
  const [preview, setPreview] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get("/inventories/tags/search?q=").then(() => setCategories([]));
    setCategories([
      { id: 1, name: "Equipment" },
      { id: 2, name: "Furniture" },
      { id: 3, name: "Book" },
      { id: 4, name: "Other" },
    ]);
  }, []);

  const scheduleAutoSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await api.patch(`/inventories/${inventory.id}`, {
          title,
          description,
          isPublic,
          categoryId: categoryId || undefined,
          tagNames: tags,
          version,
        });
        setVersion(res.data.version);
        setSaveStatus("saved");
        onUpdate();
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err: any) {
        if (err.response?.data?.message === "versionConflict") {
          alert(t("errors.versionConflict"));
          onUpdate();
        }
        setSaveStatus("idle");
      }
    }, 7000);
  };

  const handleChange = (fn: () => void) => {
    fn();
    scheduleAutoSave();
  };

  const handleTagInput = async (val: string) => {
    setTagInput(val);
    if (val.trim()) {
      const res = await api.get(
        `/inventories/tags/search?q=${encodeURIComponent(val)}`,
      );
      setTagSuggestions(res.data);
    } else {
      setTagSuggestions([]);
    }
  };

  const addTag = (name: string) => {
    if (!tags.includes(name)) {
      const next = [...tags, name];
      setTags(next);
      scheduleAutoSave();
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const removeTag = (name: string) => {
    setTags((prev) => prev.filter((t) => t !== name));
    scheduleAutoSave();
  };

  const handleDelete = async () => {
    if (!confirm(t("inventory.deleteConfirm"))) return;
    await api.delete(`/inventories/${inventory.id}`);
    navigate("/");
  };

  return (
    <div className="row">
      <div className="col-12 col-lg-8">
        <div className="mb-3 text-end">
          {saveStatus === "saving" && (
            <span className="text-muted small">⏳ {t("common.saving")}</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-success small">
              ✅ {t("common.allChangesSaved")}
            </span>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label fw-medium">{t("inventory.title")}</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => handleChange(() => setTitle(e.target.value))}
          />
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-medium mb-0">
              {t("inventory.description")}
            </label>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "✏️ Edit" : "👁 Preview"}
            </button>
          </div>
          {preview ? (
            <div className="border rounded p-3 min-vh-10">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) =>
                handleChange(() => setDescription(e.target.value))
              }
              placeholder="Markdown supported..."
            />
          )}
        </div>

        <div className="mb-3">
          <label className="form-label fw-medium">
            {t("inventory.category")}
          </label>
          <select
            className="form-select"
            value={categoryId}
            onChange={(e) =>
              handleChange(() =>
                setCategoryId(e.target.value ? Number(e.target.value) : ""),
              )
            }
          >
            <option value="">—</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 position-relative">
          <label className="form-label fw-medium">{t("inventory.tags")}</label>
          <div className="d-flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge bg-primary-subtle text-primary-emphasis"
              >
                #{tag}
                <button
                  className="btn-close btn-close ms-1"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => removeTag(tag)}
                />
              </span>
            ))}
          </div>
          <input
            className="form-control"
            placeholder="Add tag..."
            value={tagInput}
            onChange={(e) => handleTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                addTag(tagInput.trim());
              }
            }}
          />
          {tagSuggestions.length > 0 && (
            <ul
              className="list-group position-absolute w-100"
              style={{ zIndex: 100, top: "100%" }}
            >
              {tagSuggestions.map((s) => (
                <li
                  key={s.id}
                  className="list-group-item list-group-item-action"
                  style={{ cursor: "pointer" }}
                  onClick={() => addTag(s.name)}
                >
                  #{s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) =>
                handleChange(() => setIsPublic(e.target.checked))
              }
            />
            <label className="form-check-label" htmlFor="isPublic">
              {t("inventory.isPublic")}
            </label>
          </div>
        </div>

        <div className="border border-danger rounded p-3">
          <h6 className="text-danger">Danger zone</h6>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleDelete}
          >
            🗑 {t("common.delete")} inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
