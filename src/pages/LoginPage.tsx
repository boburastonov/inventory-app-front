import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";

import api from "../api/axios";
import { useAuthStore } from "../store/auth.store";

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { fetchMe } = useAuthStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/login", data);
      await fetchMe();
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.message || "invalidCredentials";
      setError(t(`auth.${msg}`) || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-8 col-md-6 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">{t("auth.login")}</h4>

            {params.get("verified") && (
              <div className="alert alert-success py-2">
                ✅ {t("auth.emailVerified")}
              </div>
            )}
            {params.get("error") === "google_failed" && (
              <div className="alert alert-danger py-2">
                Google login failed. Try again.
              </div>
            )}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="form-label">{t("auth.email")}</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  {...register("email", { required: true })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">{t("auth.password")}</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  {...register("password", { required: true })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.login")}
              </button>
            </form>

            <div className="d-flex align-items-center mb-3">
              <hr className="flex-grow-1" />
              <span className="px-2 text-muted small">or</span>
              <hr className="flex-grow-1" />
            </div>

            <a
              href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000"}/api/auth/google`}
              className="btn btn-outline-danger w-100 mb-3"
            >
              🔴 {t("auth.loginWithGoogle")}
            </a>

            <p className="text-center mb-0 small">
              {t("auth.noAccount")}{" "}
              <Link to="/register">{t("auth.register")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
