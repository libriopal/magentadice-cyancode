import { useSandboxSession } from './hooks/useSandboxSession';
import { SandboxShell } from './components/SandboxShell';

export function SandboxApp() {
  const { state, dispatch, isConnected } = useSandboxSession();
  return (
    <SandboxShell
      state={state}
      dispatch={dispatch}
      isConnected={isConnected}
    />
  );
}
