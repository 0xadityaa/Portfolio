"use client";

import React, { useState, useRef, useEffect } from "react";

interface CommandHistory {
  command: string;
  output: string;
}

export function BrutalistTerminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      command: "welcome",
      output: "Initializing system... Aditya Negandhi Portfolio OS [v1.0.0]\nType 'help' to see list of available commands.",
    },
  ]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    let output = "";

    switch (cmd) {
      case "help":
        output = `Available commands:
  whoami   - Display profile info
  skills   - List technical tools and expertise
  contact  - Show links to reach out
  clear    - Clear the screen
  system   - System specs & location`;
        break;
      case "whoami":
        output = "Aditya Negandhi - Full Stack Engineer and aspiring Solutions Architect, building things that live on the web. I thrive on architecting end-to-end features and building solid dev tools.";
        break;
      case "skills":
        output = "Languages: TypeScript, JavaScript, Python, Java\nBackend: Nest.js, Node.js, Spring Boot, FastAPI, Supabase, Convex\nFrontend: React, Next.js, Tailwind, Tanstack, Redux\nDatabases: PostgreSQL, Spanner, MongoDB, MySQL, Redis, PostGIS\nDevOps: Docker, Azure, GCP, GitHub Actions, OpenTelemetry";
        break;
      case "contact":
        output = "Email: negandhi.aditya@gmail.com\nGitHub: https://github.com/0xadityaa\nLinkedIn: https://www.linkedin.com/in/aditya-negandhi\nX: https://x.com/0xadityaa";
        break;
      case "system":
        output = "Location: Toronto, ON\nShell: zsh\nStatus: Online & Building 🧠 & ❤️";
        break;
      case "clear":
        setHistory([]);
        setInput("");
        return;
      default:
        output = `Command not found: '${cmd}'. Type 'help' for suggestions.`;
    }

    setHistory((prev) => [...prev, { command: input, output }]);
    setInput("");
  };

  return (
    <div className="border-2 border-black dark:border-white bg-black text-white p-4 font-mono text-xs sm:text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none h-60 flex flex-col justify-between select-none">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block"></span>
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
        </div>
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">sh -- guest@0xadityaa</span>
        <span className="w-4"></span>
      </div>

      {/* Terminal logs body */}
      <div className="flex-grow overflow-y-auto mb-2 pr-1 scrollbar-thin">
        {history.map((item, idx) => (
          <div key={idx} className="mb-2">
            {item.command !== "welcome" && (
              <div className="flex items-center gap-1 text-neutral-400 font-bold">
                <span>$</span>
                <span>{item.command}</span>
              </div>
            )}
            <pre className="border-none bg-transparent shadow-none p-0 my-1 font-mono text-xs sm:text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed select-text">
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Prompt Form */}
      <form onSubmit={handleCommand} className="flex items-center gap-1.5 border-t border-neutral-800 pt-2 shrink-0">
        <span className="text-green-500 font-bold select-none">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-transparent text-white font-mono text-xs sm:text-sm focus:outline-none border-none p-0 select-text"
          placeholder="help..."
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </form>
    </div>
  );
}
