import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  adminVerificationAPI,
} from "../services/api";
import "./AdminVerification.css";

function AdminVerification() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const [stats, setStats] = useState({
    pending: 0,
    changesRequested: 0,
    published: 0,
    rejected: 0,
  });

  // =====================================================
  // LOAD PENDING ITEMS + STATISTICS
  // =====================================================

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        articlesResponse,
        quizzesResponse,
        statsResponse,
      ] = await Promise.all([
        adminVerificationAPI.getPendingArticles(),
        adminVerificationAPI.getPendingQuizzes(),
        adminVerificationAPI.getStats(),
      ]);

      // =====================================================
      // UPDATE DASHBOARD STATISTICS
      // =====================================================

      setStats(
        statsResponse.data.data || {
          pending: 0,
          changesRequested: 0,
          published: 0,
          rejected: 0,
        }
      );

      // =====================================================
      // TRANSFORM ARTICLES
      // =====================================================

      const articles = (
        articlesResponse.data.data || []
      ).map((article) => ({
        id: article._id,
        type: "article",
        title: article.title,
        author: article.author || "Unknown Author",
        category:
          article.category || "Uncategorized",

        readingTime:
          article.readingTime !== undefined
            ? `${article.readingTime} min`
            : "5 min",

        content: article.content || "",

        status: article.status,

        reviewComment:
          article.reviewFeedback || "",

        submittedAt: article.createdAt
          ? new Date(
              article.createdAt
            ).toLocaleString()
          : "Unknown",

        questions: [],

        originalData: article,
      }));

      // =====================================================
      // TRANSFORM QUIZZES
      // =====================================================

      const quizzes = (
        quizzesResponse.data.data || []
      ).map((quiz) => ({
        id: quiz._id,
        type: "quiz",
        title: quiz.title,

        author:
          quiz.createdBy || "Unknown Author",

        category: "Quiz",

        readingTime: "",

        content: quiz.description || "",

        status: quiz.status,

        reviewComment:
          quiz.reviewFeedback || "",

        submittedAt: quiz.createdAt
          ? new Date(
              quiz.createdAt
            ).toLocaleString()
          : "Unknown",

        questions: quiz.questions || [],

        originalData: quiz,
      }));

      // =====================================================
      // COMBINE ARTICLES + QUIZZES
      // =====================================================

      const combinedItems = [
        ...articles,
        ...quizzes,
      ];

      setItems(combinedItems);

      // =====================================================
      // KEEP SELECTED ITEM IF STILL AVAILABLE
      // =====================================================

      setSelectedItem((currentSelected) => {
        if (!currentSelected) {
          return combinedItems.length > 0
            ? combinedItems[0]
            : null;
        }

        return (
          combinedItems.find(
            (item) =>
              item.id === currentSelected.id
          ) || null
        );
      });
    } catch (err) {
      console.error(
        "Failed to load admin verification items:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please sign in again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You do not have permission to access Admin Verification."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load pending submissions."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadPendingItems();
  }, []);

  // =====================================================
  // DASHBOARD COUNTS
  // =====================================================

  const pendingCount = stats.pending;

  const changesCount =
    stats.changesRequested;

  const publishedCount =
    stats.published;

  const rejectedCount =
    stats.rejected;

  // =====================================================
  // REVIEW QUEUE
  // =====================================================

  const reviewQueue = items.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "submitted"
  );

  // =====================================================
  // APPROVE CONTENT
  // =====================================================

  const handleApprove = async () => {
    if (!selectedItem || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      if (
        selectedItem.type === "article"
      ) {
        await adminVerificationAPI.approveArticle(
          selectedItem.id
        );
      } else {
        await adminVerificationAPI.approveQuiz(
          selectedItem.id
        );
      }

      // -------------------------------------------------
      // Reload queue + dashboard statistics
      // -------------------------------------------------

      setSelectedItem(null);

      await loadPendingItems();
    } catch (err) {
      console.error(
        "Approve error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to approve content."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // OPEN REQUEST CHANGES MODAL
  // =====================================================

  const handleRequestChanges = () => {
    if (!selectedItem || actionLoading) {
      return;
    }

    setReviewComment("");
    setModalType("changes");
  };

  // =====================================================
  // OPEN REJECT MODAL
  // =====================================================

  const handleReject = () => {
    if (!selectedItem || actionLoading) {
      return;
    }

    setReviewComment("");
    setModalType("reject");
  };

  // =====================================================
  // CONFIRM REQUEST CHANGES / REJECT
  // =====================================================

  const handleConfirmAction = async () => {
    if (
      !selectedItem ||
      !reviewComment.trim() ||
      actionLoading
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      // =================================================
      // REQUEST CHANGES
      // =================================================

      if (modalType === "changes") {
        if (
          selectedItem.type === "article"
        ) {
          await adminVerificationAPI.requestArticleChanges(
            selectedItem.id,
            reviewComment.trim()
          );
        } else {
          await adminVerificationAPI.requestQuizChanges(
            selectedItem.id,
            reviewComment.trim()
          );
        }
      }

      // =================================================
      // REJECT
      // =================================================

      else if (modalType === "reject") {
        if (
          selectedItem.type === "article"
        ) {
          await adminVerificationAPI.rejectArticle(
            selectedItem.id,
            reviewComment.trim()
          );
        } else {
          await adminVerificationAPI.rejectQuiz(
            selectedItem.id,
            reviewComment.trim()
          );
        }
      }

      // -------------------------------------------------
      // Close modal
      // -------------------------------------------------

      setSelectedItem(null);
      setModalType(null);
      setReviewComment("");

      // -------------------------------------------------
      // Reload queue + dashboard statistics
      // -------------------------------------------------

      await loadPendingItems();
    } catch (err) {
      console.error(
        "Review action error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to complete the review action."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setModalType(null);
    setReviewComment("");
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="admin-page">
        <main className="admin-content">

          <section className="page-heading">
            <h1>
              Admin Dashboard
            </h1>

            <p>
              Review and moderate article and quiz
              submissions.
            </p>
          </section>

          <div className="empty-queue">

            <div className="empty-queue-icon">
              ◷
            </div>

            <h3>
              Loading submissions...
            </h3>

            <p>
              Fetching pending content from the
              server.
            </p>

          </div>

        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-header">

        <div className="brand">

          <div className="brand-icon">
            ▣
          </div>

          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            Lumen
          </Link>

        </div>

        <nav className="navigation">

          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            ⌘ Home
          </Link>

          <Link to="/browse" style={{ color: "inherit", textDecoration: "none" }}>
            ⌕ Browse
          </Link>

          <Link to="/admin" style={{ color: "inherit", textDecoration: "none" }}>
            👥 User Mgt
          </Link>

          <Link to="/admin/verification" className="active-nav" style={{ color: "inherit", textDecoration: "none" }}>
            ☑ Verification
          </Link>

          <Link to="/profile" style={{ color: "inherit", textDecoration: "none" }}>
            ♙ Profile
          </Link>

        </nav>

        <div className="admin-account">

  <div className="admin-user-info">
    <span>
      {user?.name || "Admin"} (admin)
    </span>
  </div>

  <span className="notification">
    ♧
  </span>

  <div className="avatar">
    {user?.name
      ? user.name
          .split(" ")
          .map((name) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "AD"}
  </div>

</div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-content">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <section className="page-heading">

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Review and moderate article and quiz
            submissions.
          </p>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#ffeaea",
              color: "#c83d3d",
              border:
                "1px solid #f2caca",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">

          {/* PENDING */}

          <div className="stat-card pending">

            <div className="stat-icon">
              ◷
            </div>

            <strong>
              {pendingCount}
            </strong>

            <span>
              Pending Review
            </span>

          </div>

          {/* CHANGES REQUESTED */}

          <div className="stat-card changes">

            <div className="stat-icon">
              ⟳
            </div>

            <strong>
              {changesCount}
            </strong>

            <span>
              Changes Requested
            </span>

          </div>

          {/* PUBLISHED */}

          <div className="stat-card published">

            <div className="stat-icon">
              ✓
            </div>

            <strong>
              {publishedCount}
            </strong>

            <span>
              Published
            </span>

          </div>

          {/* REJECTED */}

          <div className="stat-card rejected">

            <div className="stat-icon">
              ×
            </div>

            <strong>
              {rejectedCount}
            </strong>

            <span>
              Rejected
            </span>

          </div>

        </section>

        {/* =================================================
            REVIEW QUEUE
        ================================================= */}

        <section className="review-section">

          <h2>
            REVIEW QUEUE ({reviewQueue.length})
          </h2>

          <div className="review-layout">

            {/* =================================================
                QUEUE
            ================================================= */}

            <div className="queue">

              {reviewQueue.map(
                (item) => (

                  <button
                    className={`queue-item ${
                      selectedItem?.id ===
                      item.id
                        ? "selected"
                        : ""
                    }`}
                    key={`${item.type}-${item.id}`}
                    onClick={() =>
                      setSelectedItem(item)
                    }
                  >

                    <div className="queue-info">

                      <div className="queue-title-row">

                        <h3>
                          {item.title}
                        </h3>

                        <span className="content-badge">

                          {item.type ===
                          "article"
                            ? "Article"
                            : "Quiz"}

                        </span>

                      </div>

                      <p>

                        {item.author}

                        {" · "}

                        {item.category}

                        {" · "}

                        {item.type ===
                        "article"
                          ? item.readingTime
                          : `${item.questions.length} questions`}

                      </p>

                    </div>

                    <span
                      className={`status ${
                        item.status ===
                        "submitted"
                          ? "pending"
                          : item.status
                      }`}
                    >
                      Pending Review
                    </span>

                  </button>

                )
              )}

              {/* =================================================
                  EMPTY QUEUE
              ================================================= */}

              {reviewQueue.length ===
                0 && (

                <div className="empty-queue">

                  <div className="empty-queue-icon">
                    ✓
                  </div>

                  <h3>
                    Review Queue is Empty
                  </h3>

                  <p>
                    There are no articles or
                    quizzes waiting for
                    verification.
                  </p>

                </div>

              )}

            </div>

            {/* =================================================
                REVIEW PANEL
            ================================================= */}

            <div className="review-panel">

              {!selectedItem ? (

                <div className="empty-panel">

                  <div className="document-icon">
                    ▤
                  </div>

                  <p>
                    Select an article or quiz
                    to review
                  </p>

                </div>

              ) : (

                <div className="selected-content">

                  {/* =================================================
                      CONTENT HEADER
                  ================================================= */}

                  <div className="content-header">

                    <div>

                      <span className="content-type">

                        {selectedItem.type ===
                        "article"
                          ? "ARTICLE"
                          : "QUIZ"}

                      </span>

                      <h2>
                        {selectedItem.title}
                      </h2>

                      <p>

                        {selectedItem.author}

                        {" · "}

                        {selectedItem.category}

                      </p>

                    </div>

                    <span className="status pending">
                      Pending Review
                    </span>

                  </div>

                  {/* =================================================
                      CONTENT BODY
                  ================================================= */}

                  <div className="content-body">

                    {/* ARTICLE */}

                    {selectedItem.type ===
                    "article" ? (

                      <>

                        <div className="article-meta">

                          <span>

                            Submitted:{" "}

                            {
                              selectedItem.submittedAt
                            }

                          </span>

                          <span>

                            Reading time:{" "}

                            {
                              selectedItem.readingTime
                            }

                          </span>

                        </div>

                        <p>
                          {
                            selectedItem.content
                          }
                        </p>

                      </>

                    ) : (

                      /* QUIZ */

                      <>

                        <div className="article-meta">

                          <span>

                            Submitted:{" "}

                            {
                              selectedItem.submittedAt
                            }

                          </span>

                          <span>

                            Questions:{" "}

                            {
                              selectedItem.questions.length
                            }

                          </span>

                        </div>

                        {selectedItem.questions.map(
                          (
                            question,
                            index
                          ) => (

                            <div
                              className="question"
                              key={
                                question._id ||
                                index
                              }
                            >

                              <h4>

                                Q
                                {index + 1}.{" "}

                                {
                                  question.question
                                }

                              </h4>

                              <ul>

                                {question.options.map(
                                  (
                                    option
                                  ) => (

                                    <li
                                      className={
                                        option ===
                                        question.correctAnswer
                                          ? "correct-answer"
                                          : ""
                                      }
                                      key={
                                        option
                                      }
                                    >

                                      {option}

                                      {option ===
                                        question.correctAnswer && (

                                        <span className="correct-label">
                                          Correct Answer
                                        </span>

                                      )}

                                    </li>

                                  )
                                )}

                              </ul>

                            </div>

                          )
                        )}

                      </>

                    )}

                  </div>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="review-actions">

                    <button
                      className="changes-button"
                      onClick={
                        handleRequestChanges
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Request Changes
                    </button>

                    <button
                      className="reject-button"
                      onClick={
                        handleReject
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Reject
                    </button>

                    <button
                      className="approve-button"
                      onClick={
                        handleApprove
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      {actionLoading
                        ? "Processing..."
                        : "Approve"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </section>

      </main>

      {/* =================================================
          REVIEW MODAL
      ================================================= */}

      {modalType && (

        <div className="modal-overlay">

          <div className="review-modal">

            {/* CLOSE */}

            <button
              className="modal-close"
              onClick={
                closeModal
              }
              disabled={
                actionLoading
              }
            >
              ×
            </button>

            {/* ICON */}

            <div className="modal-icon">

              {modalType ===
              "changes"
                ? "⟳"
                : "×"}

            </div>

            {/* TITLE */}

            <h2>

              {modalType ===
              "changes"
                ? "Request Changes"
                : "Reject Content"}

            </h2>

            {/* DESCRIPTION */}

            <p className="modal-description">

              {modalType ===
              "changes"
                ? "Provide feedback to the author explaining what needs to be changed."
                : "Please provide a reason for rejecting this content."}

            </p>

            {/* TEXTAREA */}

            <textarea
              value={
                reviewComment
              }
              onChange={(
                event
              ) =>
                setReviewComment(
                  event.target.value
                )
              }
              placeholder={
                modalType ===
                "changes"
                  ? "Example: Please add references and improve the explanation..."
                  : "Example: The content contains inaccurate information..."
              }
              rows="5"
              autoFocus
              disabled={
                actionLoading
              }
            />

            {/* MODAL ACTIONS */}

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={
                  closeModal
                }
                disabled={
                  actionLoading
                }
              >
                Cancel
              </button>

              <button
                className={
                  modalType ===
                  "changes"
                    ? "confirm-changes-button"
                    : "confirm-reject-button"
                }
                onClick={
                  handleConfirmAction
                }
                disabled={
                  actionLoading ||
                  !reviewComment.trim()
                }
              >
                {actionLoading
                  ? "Processing..."
                  : modalType ===
                    "changes"
                    ? "Request Changes"
                    : "Reject"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminVerification;