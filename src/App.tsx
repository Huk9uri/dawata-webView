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
    jwt?: string;
    appointmentId?: string;
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [injectedData, setInjectedData] = useState({
    jwt: "",
    appointmentId: "",
  });

  useEffect(() => {
    // 직접 window 객체에서 주입된 값 확인
    console.log("JWT:", window.jwt);
    console.log("AppointmentID:", window.appointmentId);

    // 초기 주입된 값 저장
    setInjectedData({
      jwt: window.jwt || "",
      appointmentId: window.appointmentId || "",
    });

    // 메시지 이벤트 리스너
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("받은 메시지:", data);
        setInjectedData({
          jwt: data.jwt || "",
          appointmentId: data.appointmentId || "",
        });
      } catch (error) {
        console.error("메시지 파싱 에러:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 디버그 정보 표시
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
      <h4>네이티브 앱에서 받은 데이터:</h4>
      <pre>
        JWT: {injectedData.jwt}
        AppointmentID: {injectedData.appointmentId}
      </pre>
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
