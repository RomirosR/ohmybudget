import { useAuth } from "../context/AuthContext";

/** Оборачивает API-вызов: для гостя открывает модалку и выполняет после входа. */
export function useGuardedAction() {
  const { runWithAuth } = useAuth();
  return runWithAuth;
}
