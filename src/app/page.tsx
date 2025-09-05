// @ts-nocheck
"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [workflowJson, setWorkflowJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      const workflow = await response.json();
      setWorkflowJson(JSON.stringify(workflow, null, 2));
    } catch (error) {
      console.error("Error generating workflow:", error);
      setWorkflowJson("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([workflowJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Prompt to Workflow Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your workflow (e.g., When a new Gmail arrives, summarize it with AI...)"
          rows={5}
          style={{ width: "100%", marginBottom: "1rem" }}
          className="w-full border rounded p-4"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Workflow"}
        </button>
      </form>

      {workflowJson && (
        <div>
          <h2>Generated Workflow</h2>
          <pre
            style={{ background: "#eee", padding: "1rem", overflow: "auto" }}
          >
            {workflowJson}
          </pre>
          <button onClick={downloadJson}>Download JSON</button>
        </div>
      )}
    </div>
  );
}
