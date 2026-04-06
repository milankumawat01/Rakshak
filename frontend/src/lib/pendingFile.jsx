import { createContext, useContext, useState } from "react";

const PendingFileContext = createContext(null);

export function PendingFileProvider({ children }) {
  const [pendingFile, setPendingFile] = useState(null);

  const clearPendingFile = () => setPendingFile(null);

  return (
    <PendingFileContext.Provider value={{ pendingFile, setPendingFile, clearPendingFile }}>
      {children}
    </PendingFileContext.Provider>
  );
}

export const usePendingFile = () => useContext(PendingFileContext);
