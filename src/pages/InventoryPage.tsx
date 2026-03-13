import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { useEffect, useState, useCallback } from "react";

import api from "../api/axios";
import { useAuthStore } from "../store/auth.store";

import ChatTab from "../components/inventory/ChatTab";
import ItemsTab from "../components/inventory/ItemsTab";
import StatsTab from "../components/inventory/StatsTab";
import FieldsTab from "../components/inventory/FieldsTab";
import AccessTab from "../components/inventory/AccessTab";
import SettingsTab from "../components/inventory/SettingsTab";
import CustomIdTab from "../components/inventory/CustomIdTab";

export interface InventoryField {
  id: string;
  title: string;
  description: string | null;
  fieldType: "TEXT_SINGLE" | "TEXT_MULTI" | "NUMBER" | "BOOLEAN" | "LINK";
  showInTable: boolean;
  sortOrder: number;
}

export interface Inventory {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  version: number;
  ownerId: string;
  owner: { id: string; name: string };
  category: { id: number; name: string } | null;
  tags: { tag: { id: number; name: string } }[];
  fields: InventoryField[];
  accesses: { user: { id: string; name: string; email: string } }[];
  customIdFormat: { elements: any[] } | null;
}

type TabKey =
  | "items"
  | "chat"
  | "settings"
  | "customId"
  | "fields"
  | "access"
  | "stats";

const TABS: TabKey[] = [
  "items",
  "chat",
  "settings",
  "customId",
  "fields",
  "access",
  "stats",
];

const InventoryPage = () => {
  const { t } = useTranslation();
  const { inventoryId } = useParams<{ inventoryId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("items");

  const isOwner = user?.id === inventory?.ownerId;
  const isAdmin = user?.isAdmin;
  const hasAccess =
    isOwner ||
    isAdmin ||
    inventory?.isPublic ||
    inventory?.accesses.some((a) => a.user.id === user?.id);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get(`/inventories/${inventoryId}`);
      setInventory(res.data);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [inventoryId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const canSeeTab = (tab: TabKey) => {
    if (tab === "items" || tab === "chat" || tab === "stats") return true;
    return isOwner || isAdmin;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!inventory) return null;

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-1">{inventory.title}</h4>
          <small className="text-muted">
            {t("home.creator")}: {inventory.owner.name}
            {inventory.isPublic && (
              <span className="badge bg-success ms-2">
                {t("inventory.isPublic")}
              </span>
            )}
          </small>
        </div>
      </div>

      <ul className="nav nav-tabs flex-nowrap overflow-auto mb-3">
        {TABS.filter(canSeeTab).map((tab) => (
          <li key={tab} className="nav-item">
            <button
              className={`nav-link text-nowrap ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`inventory.tabs.${tab}`)}
            </button>
          </li>
        ))}
      </ul>

      <div>
        {activeTab === "items" && (
          <ItemsTab inventory={inventory} hasWriteAccess={!!hasAccess} />
        )}
        {activeTab === "chat" && <ChatTab inventoryId={inventory.id} />}
        {activeTab === "settings" && (isOwner || isAdmin) && (
          <SettingsTab inventory={inventory} onUpdate={fetchInventory} />
        )}
        {activeTab === "customId" && (isOwner || isAdmin) && (
          <CustomIdTab inventory={inventory} onUpdate={fetchInventory} />
        )}
        {activeTab === "fields" && (isOwner || isAdmin) && (
          <FieldsTab inventory={inventory} onUpdate={fetchInventory} />
        )}
        {activeTab === "access" && (isOwner || isAdmin) && (
          <AccessTab inventory={inventory} onUpdate={fetchInventory} />
        )}
        {activeTab === "stats" && <StatsTab inventoryId={inventory.id} />}
      </div>
    </div>
  );
};

export default InventoryPage;
