import { useEffect } from "react";
import { Routes, Route } from "react-router";

import { useAuthStore } from "./store/auth.store";
import { useThemeStore } from "./store/theme.store";

import HomePage from "./pages/HomePage";
import ItemPage from "./pages/ItemPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./components/layout/Layout";
import InventoryPage from "./pages/InventoryPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";

const App = () => {
  const { fetchMe } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile/:userId" element={<ProfilePage />} />
        <Route path="inventories/:inventoryId" element={<InventoryPage />} />
        <Route
          path="inventories/:inventoryId/items/:itemId"
          element={<ItemPage />}
        />
        <Route path="search" element={<SearchPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="auth/confirm-email" element={<ConfirmEmailPage />} />
      </Route>
    </Routes>
  );
};

export default App;
