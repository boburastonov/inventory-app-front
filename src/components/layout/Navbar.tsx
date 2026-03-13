import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import { useState, useRef, useEffect } from "react";

import api from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";

const Navbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const { user, logout } = useAuthStore();
  const langRef = useRef<HTMLLIElement>(null);
  const userRef = useRef<HTMLLIElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setNavOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserOpen(false);
    navigate("/");
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
    api.patch("/users/preferences", { language: lng }).catch(() => {});
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          📦 Inventory
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${navOpen ? "show" : ""}`}>
          <form
            className="d-flex mx-lg-auto my-2 my-lg-0"
            onSubmit={handleSearch}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder={t("navbar.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: "200px" }}
            />
            <button className="btn btn-outline-primary" type="submit">
              🔍
            </button>
          </form>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 mt-2 mt-lg-0">
            <li className="nav-item">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={toggleTheme}
              >
                {theme === "light" ? "🌙 " : "☀️ "}
                {theme === "light"
                  ? t("navbar.themeDark")
                  : t("navbar.themeLight")}
              </button>
            </li>

            <li className="nav-item position-relative" ref={langRef}>
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => setLangOpen((o) => !o)}
              >
                🌐 {i18n.language === "uz" ? "O'zbek" : "English"} ▾
              </button>
              {langOpen && (
                <ul
                  className="dropdown-menu show position-absolute end-0 mt-1"
                  style={{ zIndex: 1050 }}
                >
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => changeLanguage("en")}
                    >
                      🇬🇧 English
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => changeLanguage("uz")}
                    >
                      🇺🇿 O'zbek
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {user ? (
              <li className="nav-item position-relative" ref={userRef}>
                <button
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => setUserOpen((o) => !o)}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded-circle me-1"
                    />
                  ) : (
                    "👤 "
                  )}
                  {user.name} ▾
                </button>
                {userOpen && (
                  <ul
                    className="dropdown-menu show position-absolute end-0 mt-1"
                    style={{ zIndex: 1050 }}
                  >
                    <li>
                      <Link
                        className="dropdown-item"
                        to={`/profile/${user.id}`}
                        onClick={() => setUserOpen(false)}
                      >
                        {t("navbar.profile")}
                      </Link>
                    </li>
                    {user.isAdmin && (
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/admin"
                          onClick={() => setUserOpen(false)}
                        >
                          {t("navbar.admin")}
                        </Link>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        {t("navbar.logout")}
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className="btn btn-outline-primary btn-sm w-100"
                    to="/login"
                  >
                    {t("auth.login")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary btn-sm w-100" to="/register">
                    {t("auth.register")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
