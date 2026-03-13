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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
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
        <div className="col-md-5">
          <div className="alert alert-success text-center">
            <h5>✅ {t("auth.emailSent")}</h5>
            <p>{t("auth.confirmEmail")}</p>
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
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">{t("auth.register")}</h4>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="form-label">{t("auth.name")}</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  {...register("name", { required: true })}
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
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.register")}
              </button>
            </form>

            <hr />

            <a
              href="http://localhost:3000/api/auth/google"
              className="btn btn-outline-danger w-100"
            >
              🔴 {t("auth.loginWithGoogle")}
            </a>

            <p className="text-center mt-3 mb-0">
              {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
