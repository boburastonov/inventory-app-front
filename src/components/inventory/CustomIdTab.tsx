import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import api from "../../api/axios";
import type { Inventory } from "../../pages/InventoryPage";

type ElementType =
  | "fixed"
  | "random20"
  | "random32"
  | "random6"
  | "random9"
  | "guid"
  | "datetime"
  | "sequence";

interface IdElement {
  id: string;
  type: ElementType;
  value?: string;
  format?: string;
}

const ELEMENT_TYPES: ElementType[] = [
  "fixed",
  "random20",
  "random32",
  "random6",
  "random9",
  "guid",
  "datetime",
  "sequence",
];

const previewElement = (el: IdElement): string => {
  switch (el.type) {
    case "fixed":
      return el.value ?? "TEXT";
    case "random20":
      return "X5A";
    case "random32":
      return "A3F8C2D1";
    case "random6":
      return "042381";
    case "random9":
      return "123456789";
    case "guid":
      return "xxxxxxxx-xxxx";
    case "datetime":
      return new Date().toLocaleDateString();
    case "sequence":
      return el.format ? "0001" : "1";
    default:
      return "";
  }
};

const SortableElement = ({
  el,
  onRemove,
  onChange,
}: {
  el: IdElement;
  onRemove: (id: string) => void;
  onChange: (id: string, data: Partial<IdElement>) => void;
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: el.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="card-body p-2">
        <div className="d-flex align-items-center gap-1 mb-1">
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", touchAction: "none" }}
          >
            ⠿
          </span>
          <small className="fw-medium">
            {t(`customId.elements.${el.type}`)}
          </small>
          <button
            className="btn-close ms-auto"
            style={{ fontSize: "0.6rem" }}
            onClick={() => onRemove(el.id)}
          />
        </div>

        {el.type === "fixed" && (
          <input
            className="form-control form-control-sm"
            placeholder="Text..."
            value={el.value ?? ""}
            onChange={(e) => onChange(el.id, { value: e.target.value })}
            style={{ width: "100px" }}
          />
        )}
        {(el.type === "datetime" ||
          el.type === "sequence" ||
          el.type === "random20" ||
          el.type === "random32") && (
          <input
            className="form-control form-control-sm"
            placeholder="Format (e.g. D4, X5)"
            value={el.format ?? ""}
            onChange={(e) => onChange(el.id, { format: e.target.value })}
            style={{ width: "100px" }}
          />
        )}
      </div>
    </div>
  );
};

const CustomIdTab = ({
  inventory,
  onUpdate,
}: {
  inventory: Inventory;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const [elements, setElements] = useState<IdElement[]>(
    (inventory.customIdFormat?.elements ?? []).map((el: any, i: number) => ({
      ...el,
      id: el.id ?? `el-${i}`,
    })),
  );
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const preview = elements.map(previewElement).join("");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = elements.findIndex((e) => e.id === active.id);
    const newIndex = elements.findIndex((e) => e.id === over.id);
    setElements(arrayMove(elements, oldIndex, newIndex));
  };

  const handleAdd = (type: ElementType) => {
    if (elements.length >= 10) return;
    setElements((prev) => [
      ...prev,
      {
        id: `el-${Date.now()}`,
        type,
        value: type === "fixed" ? "" : undefined,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
  };

  const handleChange = (id: string, data: Partial<IdElement>) => {
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/inventories/${inventory.id}`, {
        version: inventory.version,
      });
      await api.post(`/inventories/${inventory.id}/custom-id`, { elements });
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row">
      <div className="col-12 col-lg-9">
        <p className="text-muted small">{t("customId.description")}</p>

        <div className="alert alert-secondary mb-3">
          <strong>{t("customId.preview")}: </strong>
          <code>{preview || "—"}</code>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={elements.map((e) => e.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="d-flex flex-wrap gap-2 mb-3 p-3 border rounded"
              style={{ minHeight: "80px" }}
            >
              {elements.length === 0 ? (
                <span className="text-muted small align-self-center">
                  {t("customId.dragToReorder")}
                </span>
              ) : (
                elements.map((el) => (
                  <SortableElement
                    key={el.id}
                    el={el}
                    onRemove={handleRemove}
                    onChange={handleChange}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mb-3">
          <label className="form-label small fw-medium">
            {t("customId.addElement")}
          </label>
          <div className="d-flex flex-wrap gap-1">
            {ELEMENT_TYPES.map((type) => (
              <button
                key={type}
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleAdd(type)}
                disabled={elements.length >= 10}
              >
                + {t(`customId.elements.${type}`)}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
};

export default CustomIdTab;
