"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

const CHOICES = ["A", "B", "C", "D", "E"];

export default function TakeExamPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [answerPdfUrl, setAnswerPdfUrl] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [flagged, setFlagged] = useState<any>({});
  const [showResults, setShowResults] = useState(false);

  // ⏱ Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [running, setRunning] = useState(false);

  const playAlarm = () => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    );
    audio.play();
  };

  useEffect(() => {
    async function loadData() {
      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_number");

      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (qData) setQuestions(qData);

      if (examData?.question_pdf_path) {
        const { data } = supabase.storage
          .from("exam-pdfs")
          .getPublicUrl(examData.question_pdf_path);
        setPdfUrl(data.publicUrl);
      }

      if (examData?.answer_pdf_path) {
        const { data } = supabase.storage
          .from("exam-pdfs")
          .getPublicUrl(examData.answer_pdf_path);
        setAnswerPdfUrl(data.publicUrl);
      }
    }

    loadData();
  }, [examId]);

  // ⏱ Timer logic
  useEffect(() => {
    if (!running || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) playAlarm();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, timeLeft]);

  if (!questions.length || !pdfUrl) {
    return <div style={{ padding: 40 }}>Loading exam...</div>;
  }

  const current = questions[currentIndex];

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ================= RESULTS =================
  if (showResults) {
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      if (answers[q.id]) {
        if (answers[q.id] === q.correct_answer) correct++;
        else incorrect++;
      }
    });

    return (
      <main style={{ background: "#dbeafe", minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 1500, margin: "0 auto" }}>
          <h1 style={{ color: "black" }}>Results</h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 24 }}>
            
            <div style={{ background: "white", padding: 12, maxHeight: 900, overflowY: "scroll" }}>
              {questions.map((q) => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correct_answer;

                return (
                  <div
                    key={q.id}
                    style={{
                      marginTop: 8,
                      padding: 8,
                      fontSize: 13,
                      background: isCorrect ? "#bfdbfe" : "#fecaca",
                    }}
                  >
                    Q{q.question_number}: {selected || "-"} | {q.correct_answer}
                  </div>
                );
              })}
            </div>

            <div style={{ background: "white", padding: 20 }}>
              <iframe
                src={`${answerPdfUrl}#toolbar=0`}
                width="100%"
                height="1100px"
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ================= EXAM =================
  return (
    <main style={{ background: "#dbeafe", minHeight: "100vh", padding: 24 }}>
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr",
          gap: 24,
        }}
      >
        {/* PDF */}
        <div style={{ background: "#60a5fa", padding: 16 }}>
          <h2 style={{ color: "black" }}>
            Question {current.question_number}
          </h2>

          <iframe
            src={`${pdfUrl}#page=${current.question_number}&toolbar=0`}
            width="100%"
            height="820px"
          />
        </div>

        {/* RIGHT PANEL */}
        <div style={{ background: "#3b82f6", padding: 20, color: "black" }}>
          
          {/* TIMER */}
          <div style={{ marginBottom: 20 }}>
            <h3>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </h3>

            <input
              type="number"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(Number(e.target.value))}
              style={{ width: "100%", padding: 8 }}
            />

            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => setTimeLeft(inputMinutes * 60)}>Set</button>
              <button onClick={() => setRunning(true)}>Start</button>
              <button onClick={() => setRunning(false)}>Stop</button>
              <button onClick={() => setTimeLeft(0)}>Reset</button>
            </div>
          </div>

          {/* FLAG */}
          <button
            onClick={() =>
              setFlagged((prev: any) => ({
                ...prev,
                [current.id]: !prev[current.id],
              }))
            }
            style={{
              width: "100%",
              padding: 10,
              background: flagged[current.id] ? "#facc15" : "white",
              border: "2px solid black",
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            {flagged[current.id] ? "🚩 Flagged" : "Flag Question"}
          </button>

          {/* ANSWERS */}
          {CHOICES.map((choice) => (
            <button
              key={choice}
              onClick={() =>
                setAnswers((prev: any) => ({
                  ...prev,
                  [current.id]: choice,
                }))
              }
              style={{
                display: "block",
                width: "100%",
                marginTop: 10,
                padding: 16,
                background:
                  answers[current.id] === choice ? "#2563eb" : "black",
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {choice}
            </button>
          ))}

          {/* GRID NAV */}
          <div style={{ marginTop: 20 }}>
            <h4>Questions</h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                marginTop: 8,
              }}
            >
              {questions.map((q, i) => {
                const isAnswered = answers[q.id];
                const isFlagged = flagged[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      padding: 8,
                      fontSize: 12,
                      background: isFlagged
                        ? "#facc15"
                        : isAnswered
                        ? "#2563eb"
                        : "#e5e7eb",
                      color: isAnswered ? "white" : "black",
                    }}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* NAV */}
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setCurrentIndex((i) => i - 1)}>
              Prev
            </button>

            <button onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
            </button>

            <button
              onClick={() => setShowResults(true)}
              style={{ marginLeft: 10 }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}