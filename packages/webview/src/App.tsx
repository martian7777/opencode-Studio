import { useState } from "react";
import { Header } from "./components/Header.tsx";
import { MessageList } from "./components/MessageList.tsx";
import { Composer } from "./components/Composer.tsx";
import { SessionSidebar } from "./components/SessionSidebar.tsx";

export function App() {
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className="relative flex flex-col h-full">
      <Header onToggleSessions={() => setSidebar((v) => !v)} />
      <MessageList />
      <Composer />
      <SessionSidebar open={sidebar} onClose={() => setSidebar(false)} />
    </div>
  );
}
