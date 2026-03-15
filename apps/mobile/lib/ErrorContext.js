import { createContext, useContext, useState, useCallback } from "react";

const ErrorContext = createContext({
  error: null,
  showError: () => {},
  clearError: () => {},
});

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  const showError = useCallback((message) => {
    setError(message || "Check your connection and try again");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  return useContext(ErrorContext);
}
