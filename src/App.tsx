import "./App.css";
import { PetWindow } from "./components/PetWindow";
import { useWebSocket } from "./hooks/useWebSocket";

/** Default WebSocket URL for the Python backend */
const WS_URL = "ws://localhost:21520/ws";

function App() {
  const { sendText } = useWebSocket(WS_URL);

  return (
    <div className="app-container">
      <PetWindow onSend={sendText} />
    </div>
  );
}

export default App;
