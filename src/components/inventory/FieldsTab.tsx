import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import api from "../../api/axios";
import type { Inventory, InventoryField } from "../../pages/InventoryPage";

type FieldType = "TEXT_SINGLE" | "TEXT_MULTI" | "NUMBER" | "BOOLEAN" | "LINK";
const FIELD_TYPES: FieldType[] = [
  "TEXT_SINGLE",
  "TEXT_MULTI",
  "NUMBER",
  "BOOLEAN",
  "LINK",
];

const SortableField = ({
  field,
  onDelete,
  onUpdate,
}: {
  field: InventoryField;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<InventoryField>) => void;
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(field.title);
  const [desc, setDesc] = useState(field.description ?? "");
  const [showInTable, setShowInTable] = useState(field.showInTable);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    await onUpdate(field.id, { title, description: desc, showInTable });
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="card mb-2">
      <div className="card-body p-2">
        <div className="d-flex align-items-center gap-2">
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", touchAction: "none" }}
            className="text-muted"
          >
            ⠿
          </span>

          {editing ? (
            <div className="flex-grow-1">
              <div className="row g-2">
                <div className="col-12 col-sm-6">
                  <input
                    className="form-control form-control-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("fields.fieldTitle")}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <input
                    className="form-control form-control-sm"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={t("fields.fieldDescription")}
                  />
                </div>
                <div className="col-12">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`showInTable-${field.id}`}
                      checked={showInTable}
                      onChange={(e) => setShowInTable(e.target.checked)}
                    />
                    <label
                      className="form-check-label small"
                      htmlFor={`showInTable-${field.id}`}
                    >
                      {t("fields.showInTable")}
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-2 d-flex gap-1">
                <button className="btn btn-sm btn-primary" onClick={handleSave}>
                  {t("common.save")}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setEditing(false)}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow-1 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-1">
              <div>
                <span className="fw-medium">{field.title}</span>
                <span className="badge bg-secondary ms-2 small">
                  {t(`fields.types.${field.fieldType}`)}
                </span>
                {field.showInTable && (
                  <span className="badge bg-success ms-1 small">table</span>
                )}
                {field.description && (
                  <small className="text-muted ms-2">{field.description}</small>
                )}
              </div>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setEditing(true)}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(field.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FieldsTab = ({
  inventory,
  onUpdate,
}: {
  inventory: Inventory;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState<InventoryField[]>(inventory.fields);
  const [newType, setNewType] = useState<FieldType>("TEXT_SINGLE");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    setFields(reordered);

    await api.patch(`/inventories/${inventory.id}/fields/reorder`, {
      orderedIds: reordered.map((f) => f.id),
    });
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await api.post(`/inventories/${inventory.id}/fields`, {
        title: newTitle,
        fieldType: newType,
      });
      setFields((prev) => [...prev, res.data]);
      setNewTitle("");
      setAdding(false);
      onUpdate();
    } catch (err: any) {
      if (err.response?.data?.message === "limitReached") {
        alert(t("fields.limitReached", { max: err.response.data.max }));
      }
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/inventories/${inventory.id}/fields/${id}`);
    setFields((prev) => prev.filter((f) => f.id !== id));
    onUpdate();
  };

  const handleUpdate = async (id: string, data: Partial<InventoryField>) => {
    const res = await api.patch(
      `/inventories/${inventory.id}/fields/${id}`,
      data,
    );
    setFields((prev) => prev.map((f) => (f.id === id ? res.data : f)));
    onUpdate();
  };

  return (
    <div className="row">
      <div className="col-12 col-lg-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.length === 0 ? (
              <p className="text-muted">{t("fields.dragToReorder")}</p>
            ) : (
              fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </SortableContext>
        </DndContext>

        {adding ? (
          <div className="card mt-2">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-12 col-sm-6">
                  <input
                    className="form-control form-control-sm"
                    placeholder={t("fields.fieldTitle")}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <select
                    className="form-select form-select-sm"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FieldType)}
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`fields.types.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 d-flex gap-1">
                <button className="btn btn-sm btn-primary" onClick={handleAdd}>
                  {t("common.add")}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setAdding(false)}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-outline-primary btn-sm mt-2"
            onClick={() => setAdding(true)}
          >
            + {t("fields.addField")}
          </button>
        )}
      </div>
    </div>
  );
};

export default FieldsTab;
