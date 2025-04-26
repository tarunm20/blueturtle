"use client";
import { useState } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea"; // Corrected Textarea import
import { Spinner } from "@kit/ui/spinner";
import { Input } from "@kit/ui/input";  // Using Input component for the DB URL
import { Card } from "@kit/ui/card";   // Using Card component for structuring

import axios from "axios";

const ChatPage = () => {
  const [userPrompt, setUserPrompt] = useState(""); // State to store prompt input
  const [dbUrl, setDbUrl] = useState("");  // State to store the database URL
  const [response, setResponse] = useState<any | null>(null); // State to store the response from backend
  const [loading, setLoading] = useState(false); // State to manage loading spinner
  const [error, setError] = useState<string | null>(null); // State to store error message
  const [executing, setExecuting] = useState(false); // State to manage SQL execution

  const handleSubmit = async () => {
    if (userPrompt && dbUrl) {
      setLoading(true);
      setError(null); // Reset error
      try {
        // Sending user_prompt and db_url in the payload
        const res = await axios.post("http://127.0.0.1:8000/generate_sql", { user_prompt: userPrompt, db_url: dbUrl });
        setResponse(res.data);  // Assuming API returns data
      } catch (error) {
        console.error("Error during request:", error);
        setError("Failed to generate SQL. Please try again.");
      }
      setLoading(false);
    }
  };

  const executeSQL = async () => {
    if (!response?.sql) return;
    setExecuting(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/execute_sql", { sql: response.sql, db_url: dbUrl });
      setResponse((prevResponse: any) => ({
        ...prevResponse,
        executionResult: res.data,
      }));
    } catch (error) {
      console.error("Error during SQL execution:", error);
      setError("Failed to execute SQL. Please try again.");
    }
    setExecuting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">Chat with Database</h1>

        <div className="mb-4">
          <label className="block text-lg font-medium">Prompt:</label>
          <Textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Write your prompt here"
            rows={4}
            className="mt-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium">Database URL:</label>
          <Input
            type="text"
            value={dbUrl}
            onChange={(e) => setDbUrl(e.target.value)}
            placeholder="Enter database URL"
            className="mt-2"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? <Spinner /> : "Generate SQL"}
        </Button>

        {error && (
          <div className="mt-4 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Generated SQL:</h2>
            <div className="p-4 bg-gray-100 border rounded-md">
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>

            {response?.sql && (
              <Button
                onClick={executeSQL}
                className="w-full mt-4"
                disabled={executing}
              >
                {executing ? <Spinner /> : "Execute SQL"}
              </Button>
            )}
          </div>
        )}

        {response?.executionResult && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Execution Result:</h3>
            <div className="p-4 bg-gray-100 border rounded-md">
              <pre>{JSON.stringify(response.executionResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatPage;
