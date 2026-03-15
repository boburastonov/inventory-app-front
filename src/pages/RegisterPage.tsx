import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import api from "../api/axios";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

const RegisterPage = () => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", data);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        msg === "emailAlreadyExists"
          ? "Bu email allaqachon ro'yxatdan o'tgan"
          : t("common.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-5">
          <div className="alert alert-success text-center p-4">
            <div className="fs-1 mb-2">✅</div>
            <h5>{t("auth.emailSent")}</h5>
            <p className="mb-3">{t("auth.confirmEmail")}</p>
            <Link to="/login" className="btn btn-primary">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-8 col-md-6 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">{t("auth.register")}</h4>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="form-label">{t("auth.name")}</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  {...register("name", { required: true, minLength: 2 })}
                />
              </div>

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
                  {...register("password", { required: true, minLength: 6 })}
                />
                {errors.password?.type === "minLength" && (
                  <div className="invalid-feedback d-block">
                    Parol kamida 6 ta belgidan iborat bo'lishi kerak
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.register")}
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
              {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
