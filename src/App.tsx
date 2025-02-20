import { useState, useEffect } from "react";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";

import "@livekit/components-styles";

import { Track } from "livekit-client";

const serverUrl = "wss://dawata-3r907ysh.livekit.cloud";

declare global {
  interface Window {
    // 주입될 데이터의 타입을 정의합니다
    injectedJavaScript?: {
      jwt?: string;
      appointmentId?: number;
      // 필요한 다른 필드들을 여기에 추가
    };
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [injectedJavaScript, setInjectedJavaScript] = useState<
    Window["injectedJavaScript"] | null
  >(null);

  useEffect(() => {
    // 주입된 데이터 확인
    console.log("Window객체:", window);
    console.log("주입된 데이터:", window.injectedJavaScript);

    // 주입된 데이터가 있다면 state에 저장
    if (window.injectedJavaScript) {
      setInjectedJavaScript(window.injectedJavaScript);
    }

    // 데이터 주입 이벤트 리스너
    const handleMessage = (event: MessageEvent) => {
      console.log("메시지 이벤트 수신:", event.data);
      setInjectedJavaScript(event.data);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 주입된 데이터 표시를 위한 디버그 영역 추가
  const renderDebugInfo = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        zIndex: 9999,
      }}
    >
      <h4>디버그 정보:</h4>
      <pre>{JSON.stringify(injectedJavaScript, null, 2)}</pre>
    </div>
  );

  const handleJoin = async () => {
    try {
      const response = await fetch("https://i12a301.p.ssafy.io/live/1/token");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setToken(data.data);
    } catch (error) {
      console.error("Failed to fetch token:", error);
    }
  };

  if (!token) {
    return (
      <div>
        {renderDebugInfo()}
        <h2>Join a Room</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={handleJoin}>Join</button>
      </div>
    );
  }

  return (
    <>
      {renderDebugInfo()}
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        // Use the default LiveKit theme for nice styles.
        data-lk-theme="default"
        style={{ height: "100vh" }}
      >
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen
        share tracks and to leave the room. */}
        <ControlBar />
      </LiveKitRoom>
    </>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}
