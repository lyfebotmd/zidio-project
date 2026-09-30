"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  sentiment: string | null;
  sentimentScore: number | null;
  summary: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, source: "dashboard_manual" }),
      });

      if (res.ok) {
        setNewContent("");
        await fetchFeedback();
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/feedback/analyze", { method: "POST" });
      if (res.ok) {
        await fetchFeedback();
      }
    } catch (err) {
      console.error("Failed to run AI analysis:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // CSV File Handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCsv(true);
    setCsvStatus("Parsing CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          setCsvStatus("Importing rows into database...");
          const res = await fetch("/api/feedback/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: results.data }),
          });

          const data = await res.json();
          if (res.ok) {
            setCsvStatus(`Success! Imported ${data.count} items.`);
            await fetchFeedback();
          } else {
            setCsvStatus(`Error: ${data.error}`);
          }
        } catch (err) {
          setCsvStatus("Failed to upload CSV data.");
        } finally {
          setUploadingCsv(false);
        }
      },
      error: () => {
        setCsvStatus("Error parsing CSV file.");
        setUploadingCsv(false);
      },
    });
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 16px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>Project LOOP</h1>
          <p style={{ color: "#666", margin: "4px 0 0 0" }}>Customer Feedback Intelligence Dashboard</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            opacity: analyzing ? 0.6 : 1,
          }}
        >
          {analyzing ? "Analyzing with Claude..." : "Run AI Sentiment Analysis"}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        {/* Single Item Entry */}
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>Add Single Feedback</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste customer comment here..."
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
            />
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              style={{
                marginTop: "10px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {submitting ? "Saving..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        {/* Bulk CSV Upload */}
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Bulk CSV Import</h3>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Upload a CSV containing a <code style={{ background: "#eee", padding: "2px 4px" }}>content</code> column.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            disabled={uploadingCsv}
            style={{ marginBottom: "12px", fontSize: "14px" }}
          />
          {csvStatus && (
            <p style={{ fontSize: "13px", margin: 0, fontWeight: "bold", color: csvStatus.startsWith("Error") ? "#dc2626" : "#16a34a" }}>
              {csvStatus}
            </p>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div>
        <h3 style={{ fontSize: "20px", marginBottom: "16px" }}>Feedback Directory ({feedback.length})</h3>
        {loading ? (
          <p>Loading entries...</p>
        ) : feedback.length === 0 ? (
          <p style={{ color: "#888" }}>No feedback entries yet. Add one above or import a CSV file!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {feedback.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor:
                        item.sentiment === "POSITIVE"
                          ? "#dcfce7"
                          : item.sentiment === "NEGATIVE"
                          ? "#fee2e2"
                          : "#f3f4f6",
                      color:
                        item.sentiment === "POSITIVE"
                          ? "#15803d"
                          : item.sentiment === "NEGATIVE"
                          ? "#b91c1c"
                          : "#374151",
                    }}
                  >
                    {item.sentiment || "PENDING ANALYSIS"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111" }}>{item.content}</p>
                {item.summary && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", fontStyle: "italic" }}>
                    AI Summary: {item.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}