// @ts-nocheck
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const systemPromptTemplate = `
You are a workflow generator for Activepieces. Your ONLY task is to convert a user's natural language request into a valid Activepieces workflow JSON structure that can be imported directly.

CRITICAL INSTRUCTIONS:
1. You must respond with ONLY a raw JSON object. 
2. Do NOT include any other text, explanations, or markdown formatting.
3. YOU MUST USE THIS EXACT JSON STRUCTURE. The user will provide a description, and you must output a JSON that matches this format:

{
  "created": "1757067455429",
  "updated": "1757067455429",
  "name": "Workflow Name Based on User Request",
  "description": "",
  "tags": [],
  "pieces": [
    "@activepieces/piece-gmail",
    "@activepieces/piece-google-gemini"
  ],
  "template": {
    "displayName": "Workflow Name Based on User Request",
    "trigger": {
      "name": "trigger",
      "valid": true,
      "displayName": "New Email",
      "type": "PIECE_TRIGGER",
      "settings": {
        "propertySettings": {
          "to": {"type": "MANUAL"},
          "auth": {"type": "MANUAL"},
          "from": {"type": "MANUAL"},
          "label": {"type": "MANUAL"},
          "subject": {"type": "MANUAL"},
          "category": {"type": "MANUAL"}
        },
        "pieceName": "@activepieces/piece-gmail",
        "pieceVersion": "~0.9.3",
        "input": {
          "auth": "{{connections['GMAIL_CONNECTION_ID']}}"
        },
        "sampleData": {},
        "triggerName": "gmail_new_email_received"
      },
      "nextAction": {
        "name": "step_1",
        "skip": false,
        "type": "PIECE",
        "valid": true,
        "settings": {
          "input": {
            "auth": "{{connections['GEMINI_CONNECTION_ID']}}",
            "model": "gemini-1.5-flash",
            "prompt": "Categorize this email as 'customer_query', 'spam', or 'other'. Respond with only the category. Email: {{trigger.body}}"
          },
          "pieceName": "@activepieces/piece-google-gemini",
          "actionName": "generate_content",
          "sampleData": {},
          "pieceVersion": "~0.0.17",
          "propertySettings": {
            "auth": {"type": "MANUAL"},
            "model": {"type": "MANUAL"},
            "prompt": {"type": "MANUAL"}
          },
          "errorHandlingOptions": {
            "retryOnFailure": {"value": false},
            "continueOnFailure": {"value": false}
          }
        },
        "displayName": "Generate Content"
      }
    },
    "valid": true,
    "agentIds": [],
    "connectionIds": [
      "GMAIL_CONNECTION_ID",
      "GEMINI_CONNECTION_ID"
    ],
    "schemaVersion": "7"
  },
  "blogUrl": ""
}

Now generate the JSON for this user request:
`;

export async function POST(request) {
  console.log("✅ API Route called");
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = systemPromptTemplate + prompt;
    console.log("Full prompt sent to AI:", fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let generatedWorkflowJson = response.text();
    console.log("Raw AI response:", generatedWorkflowJson);

    generatedWorkflowJson = generatedWorkflowJson
      .replace(/```(?:json)?\s*/g, "")
      .replace(/```/g, "")
      .trim();
    console.log("Cleaned AI response:", generatedWorkflowJson);

    const workflow = JSON.parse(generatedWorkflowJson);
    console.log("Parsed workflow:", workflow);
    return NextResponse.json(workflow);
  } catch (err) {
    console.error("Error in /api/generate-workflow:", err);
    return NextResponse.json(
      { error: "Failed to generate workflow: " + err.message },
      { status: 500 }
    );
  }
}
