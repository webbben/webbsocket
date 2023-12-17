import React, { useEffect, useState } from "react";
import { useWebSocket } from "webbsocket";

export default function WebsocketReceiver() {

    const { sendMessage, handleMessage, connectionOpen } = useWebSocket();
    const [serverResponse, setServerResponse] = useState('');

    function broadcastMessage() {
        sendMessage({
            type: "message_from_client",
            content: "hello world",
        });
    }

    useEffect(() => {
        if (!connectionOpen) {
            return;
        }

        const unsub = handleMessage((msg) => {
            console.log(msg);
            setServerResponse(msg.content);
        });

        return () => {
            unsub();
        }
    }, [connectionOpen, handleMessage]);

    return (
        <div>
            <p>Talk to the server!</p>
            <button onClick={() => broadcastMessage()}>Say "hello world"</button>
            <p>Server's response...</p>
            <p>{serverResponse}</p>
        </div>
    );
}