import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router";

const ConfirmEmailPage = () => {
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const error = params.get("error");

  return (
    <div className="row justify-content-center">
      <div className="col-md-5 text-center">
        {error ? (
          <div className="alert alert-danger">
            <h5>
              ❌{" "}
              {t("errors.invalidToken") || "Token yaroqsiz yoki muddati o'tgan"}
            </h5>
            <Link to="/login" className="btn btn-primary mt-2">
              {t("auth.login")}
            </Link>
          </div>
        ) : (
          <div className="alert alert-success">
            <h5>✅ Email tasdiqlandi!</h5>
            <Link to="/login" className="btn btn-primary mt-2">
              {t("auth.login")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
