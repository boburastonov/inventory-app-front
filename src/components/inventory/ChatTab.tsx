import { Link } from "react-router";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";

import api from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

const ChatTab = ({ inventoryId }: { inventoryId: string }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    api
      .get(`/inventories/${inventoryId}/comments`)
      .then((res) => setComments(res.data))
      .finally(() => setLoading(false));

    const socket = io("http://localhost:3000", { withCredentials: true });
    socket.emit("joinInventory", inventoryId);
    socket.on("newComment", (comment: Comment) => {
      setComments((prev) => [...prev, comment]);
    });

    return () => {
      socket.emit("leaveInventory", inventoryId);
      socket.disconnect();
    };
  }, [inventoryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.post(`/inventories/${inventoryId}/comments`, { content });
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
  };

  if (loading) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <div
        className="border rounded p-3 mb-3"
        style={{ maxHeight: "400px", overflowY: "auto" }}
      >
        {comments.length === 0 ? (
          <p className="text-muted text-center mb-0">{t("chat.noPosts")}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                {comment.author.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-circle"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                    style={{ width: 28, height: 28, fontSize: 12 }}
                  >
                    {comment.author.name[0].toUpperCase()}
                  </div>
                )}
                <Link
                  to={`/profile/${comment.author.id}`}
                  className="fw-medium text-decoration-none small"
                >
                  {comment.author.name}
                </Link>
                <small className="text-muted">
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
              <div className="ps-4 small">
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <div>
          <textarea
            className="form-control mb-2"
            rows={3}
            placeholder={t("chat.placeholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Ctrl+Enter {t("chat.send")}</small>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={sending || !content.trim()}
            >
              {sending ? t("common.loading") : t("chat.send")}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-muted text-center">
          <Link to="/login">{t("chat.loginToPost")}</Link>
        </p>
      )}
    </div>
  );
};

export default ChatTab;
