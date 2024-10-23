import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const GeminiPage = () => {
  const [summary, setSummary] = useState<string>("");
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch the summary and insights when the page loads
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);  // Start loading

        // Fetch Gemini summary and insights data from the API
        const response = await fetch("/api/gemini");
        const data = await response.json();

        // Set the data returned from the API into state
        setSummary(data.summary);  
        setInsights(data.insights);
      } catch (error) {
        console.error("Failed to fetch summary or insights:", error);
        setError("Unable to fetch summary or insights at the moment. Please try again later.");
      } finally {
        setLoading(false);  // End loading
      }
    };

    fetchSummary();
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen"
      style={{
        background: "linear-gradient(135deg, rgba(94,114,228,1) 0%, rgba(236,72,153,1) 100%)",
        padding: "2rem",
      }}
    >
      <motion.div
        className="bg-white rounded-lg p-8 shadow-2xl text-black"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: "800px",
          minHeight: "500px",
          background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,240,240,1) 100%)",
          borderRadius: "15px",
          padding: "2rem",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          className="text-4xl font-extrabold text-center mb-8"
          style={{ color: "#4A4A4A", fontFamily: "'Poppins', sans-serif" }}
        >
          Gemini AI Insights
        </h2>

        {loading ? (
          <p className="text-lg leading-relaxed text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-lg leading-relaxed text-red-500">{error}</p>
        ) : (
          <>
            {/* Render summary and insights dynamically from API */}
            <div className="text-lg leading-relaxed mb-6 text-gray-800" style={{ lineHeight: "1.75", fontFamily: "'Roboto', sans-serif" }}>
              <h3>Summary:</h3>
              <p dangerouslySetInnerHTML={{ __html: summary }} />
            </div>

            <div className="text-lg leading-relaxed mb-6 text-gray-800" style={{ lineHeight: "1.75", fontFamily: "'Roboto', sans-serif" }}>
              <h3>AI-Driven Insights:</h3>
              <ol dangerouslySetInnerHTML={{ __html: insights }} />
            </div>
          </>
        )}
      </motion.div>

      <motion.div
        className="mt-12 text-white text-sm text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p>Powered by AI Insights</p>
        <p className="text-xs" style={{ marginTop: "0.5rem" }}>Gemini AI analyzes emotions and provides actionable suggestions.</p>
      </motion.div>
    </div>
  );
};

export default GeminiPage;
