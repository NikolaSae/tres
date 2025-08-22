// Path: components/ui/use-toast.tsx
"use client";

import * as React from "react";

const ACTION_TYPES = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof ACTION_TYPES;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: Toast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<Toast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: Toast["id"];
    }
  | {
      type: ACTION_TYPES.REMOVE_TOAST;
      toastId?: Toast["id"];
    };

interface State {
  toasts: Toast[];
}

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  className?: string;
  variant?: "default" | "destructive";
  [key: string]: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ACTION_TYPES.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case ACTION_TYPES.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case ACTION_TYPES.DISMISS_TOAST: {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case ACTION_TYPES.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

const ToastsContext = React.createContext(
  null as unknown as { state: State; dispatch: React.Dispatch<Action> }
);

// OVA KOMPONENTA MORA BITI EKSPORTovana da bismo je koristili u layoutu
export function ToastsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      state.toasts.forEach((toast) => {
        if (toast.open === false) {
          dispatch({
            type: ACTION_TYPES.REMOVE_TOAST,
            toastId: toast.id,
          });
        }
      });
    }, TOAST_REMOVE_DELAY);

    return () => clearTimeout(timer);
  }, [state.toasts]);

  return (
    <ToastsContext.Provider value={[state, dispatch]}>
      {children}
    </ToastsContext.Provider>
  );
}

// OVAJ HOOK MORA BITI EKSPORTovan
export function useToast() { // Uverite se da NEMA export { useToast }; na kraju fajla ako je hook ovako definisan
  const context = React.useContext(ToastsContext);

  if (!context) {
    // Ova greška se dešava ako ToastsProvider nije renderovan iznad
    throw new Error("useToast must be used within a ToastsProvider");
  }

  const [state, dispatch] = context;

  const addToast = React.useCallback(
    ({ ...props }: Toast) => {
      const id = genId();

      const update = (props: Partial<Toast>) =>
        dispatch({
          type: ACTION_TYPES.UPDATE_TOAST,
          toast: { ...props, id },
        });

      const dismiss = () =>
        dispatch({ type: ACTION_TYPES.DISMISS_TOAST, toastId: id });

      dispatch({
        type: ACTION_TYPES.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) dismiss();
          },
        },
      });

      return {
        id: id,
        dismiss,
      };
    },
    []
  );

  return {
    ...state,
    toast: addToast,
    dismiss: React.useCallback(
      (toastId?: string) => dispatch({ type: ACTION_TYPES.DISMISS_TOAST, toastId }),
      [dispatch]
    ),
  };
}