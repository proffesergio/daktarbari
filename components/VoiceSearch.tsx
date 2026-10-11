"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

type Props = {
  onResult: (text: string) => void;
  lang?: string;
  title?: string;
};

// Bengali voice input via Web Speech API (Chrome/Edge). Graceful fallback.
export default function VoiceSearch({ onResult, lang = "bn-BD", title = "ভয়েসে খুঁজুন" }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<{ stop: () => void } | null>(null);

  // Deferred so the feature-detect setState runs outside the effect body
  // (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    const t = setTimeout(() => {
      const w = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      if (!w.SpeechRecognition && !w.webkitSpeechRecognition) setSupported(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {}
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text.trim()) onResult(text.trim());
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      aria-label={title}
      className={`flex shrink-0 items-center justify-center rounded-xl border p-2.5 transition-colors ${
        listening
          ? "animate-pulse border-red-400 bg-red-50 text-red-600"
          : "border-gray-200 text-gray-500 hover:border-emerald-600 hover:text-emerald-700"
      }`}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
