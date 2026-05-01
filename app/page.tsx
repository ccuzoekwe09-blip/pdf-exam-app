"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [title, setTitle] = useState("Practice Exam");
  const [questionPdf, setQuestionPdf] = useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [examId, setExamId] = useState<string | null>(null);

  async function uploadFile(file: File, folder: string) {
    const filePath = `${folder}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("exam-pdfs")
      .upload(filePath, file);

    if (error) throw error;
    return filePath;
  }

  async function createExam() {
    try {
      if (!questionPdf || !answerPdf) {
        setStatus("Please upload both PDFs.");
        return;
      }

      setStatus("Uploading PDFs...");

      const questionPath = await uploadFile(questionPdf, "questions");
      const answerPath = await uploadFile(answerPdf, "answers");

      setStatus("Creating exam...");

      const { data, error } = await supabase
        .from("exams")
        .insert({
          title,
          question_pdf_path: questionPath,
          answer_pdf_path: answerPath,
          total_questions: 200,
        })
        .select()
        .single();

      if (error) throw error;

      setExamId(data.id);
      setStatus("Exam created successfully.");
    } catch (error: any) {
      setStatus(error.message || "Something went wrong.");
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>PDF Exam Builder</h1>

      <div style={{ marginTop: 20 }}>
        <label>Exam title</label>
        <br />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, width: 300 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Question PDF</label>
        <br />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setQuestionPdf(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Answer/Rationale PDF</label>
        <br />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setAnswerPdf(e.target.files?.[0] || null)}
        />
      </div>

      <button onClick={createExam} style={{ marginTop: 20, padding: 12 }}>
        Create Exam
      </button>

      {status && <p style={{ marginTop: 20 }}>{status}</p>}

      {examId && (
        <div style={{ marginTop: 20 }}>
          <p><strong>Exam ID:</strong></p>
          <p>{examId}</p>
        </div>
      )}
    </main>
  );
}