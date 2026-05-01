"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function AdminExamPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [answerKeyText, setAnswerKeyText] = useState("");
  const [status, setStatus] = useState("");

  async function saveAnswerKey() {
    try {
      const lines = answerKeyText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const rows = lines.map((line) => {
        const [numberRaw, answerRaw, ...rationaleParts] = line.split(",");

        return {
          exam_id: examId,
          question_number: Number(numberRaw),
          correct_answer: answerRaw.trim().toUpperCase(),
          rationale: rationaleParts.join(",").trim(),
        };
      });

      const { error } = await supabase
        .from("questions")
        .upsert(rows, { onConflict: "exam_id,question_number" });

      if (error) throw error;

      setStatus(`Saved ${rows.length} questions successfully.`);
    } catch (err: any) {
      setStatus(err.message || "Error saving answer key.");
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Add Answer Key</h1>

      <p>Paste answers like this:</p>

      <pre>
{`1,A,Rationale for question 1
2,B,Rationale for question 2
3,C,Rationale for question 3`}
      </pre>

      <textarea
        value={answerKeyText}
        onChange={(e) => setAnswerKeyText(e.target.value)}
        style={{ width: "100%", height: 300, marginTop: 20 }}
        placeholder={`1,A,Rationale here
2,B,Rationale here
3,C,Rationale here`}
      />

      <br />

      <button
        onClick={saveAnswerKey}
        style={{ marginTop: 20, padding: 12 }}
      >
        Save Answer Key
      </button>

      {status && <p style={{ marginTop: 20 }}>{status}</p>}
    </main>
  );
}