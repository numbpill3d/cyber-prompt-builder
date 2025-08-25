import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

import { v4 as uuidv4 } from 'uuid';

function genId() {
  return uuidv4();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  const existingTimeout = toastTimeouts.get(toastId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
};
};

function handleAddToast(state, action) {
  // handle add toast
}

function handleUpdateToast(state, action) {
  // handle update toast
}

// Use these in the main reducer
switch (action.type) {
  case 'ADD_TOAST':
    return handleAddToast(state, action);
  case 'UPDATE_TOAST':
    return handleUpdateToast(state, action);
  // other cases
}

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  const prevState = memoryState;
  memoryState = reducer(memoryState, action);
  const changedKeys = Object.keys(memoryState).filter(key => memoryState[key] !== prevState[key]);
  listeners.forEach((listener) => {
    if (changedKeys.some(key => listener.dependencies.includes(key))) {
      listener(memoryState);
    }
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) => {
    // Exclude 'id' from props to prevent overwriting the generated id
    const { id: _ignoredId, ...restProps } = props;
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...restProps, id },
    });
  };
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
type Toast = Omit<ToasterToast, "id">;

function createToast(props: Toast) {
  const id = genId();
  return { ...props, id, open: true };
}

function updateToast(props: ToasterToast) {
  dispatch({
    type: "UPDATE_TOAST",
    toast: props,
  });
}

function dismissToast(id: string) {
  dispatch({ type: "DISMISS_TOAST", toastId: id });
}

function toast(props: Toast) {
  const newToast = createToast(props);
  
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...newToast,
      onOpenChange: (open) => {
        if (!open) dismissToast(newToast.id);
      },
    },
  });

  return {
    id: newToast.id,
    dismiss: () => dismissToast(newToast.id),
    update: (updatedProps: ToasterToast) => updateToast({ ...updatedProps, id: newToast.id }),
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
React.useEffect(() => {
  listeners.push(setState);
  return () => {
    const index = listeners.indexOf(setState);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}, []); // Empty dependency array

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
