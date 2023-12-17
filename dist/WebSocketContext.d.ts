import React, { ReactNode } from "react";
interface WebSocketProviderProps {
    children: ReactNode;
    /** JWT auth token to be sent to the server, if you'd like to authorize your websocket clients.
     *
     * If provided, will be sent as a message of type "authorization" after initial connection is established.
     * The server should wait for this authorization message and verify the token (stored in the message "content") before
     * trusting a websocket connection.
     */
    authToken?: string;
    /** Enables printing debug statements to the console; useful if you want to investigate issues with this websocket provider.
     *
     * Warnings and errors will be printed to the console regardless of this setting.
     */
    debug?: boolean;
    /**
     * URL of the server/port/endpoint listening for this websocket connection, e.g. "localhost:8080/ws/endpoint".
     *
     * Note: do not include any protocols (http, https, ws, etc). We add the 'ws' protocol in ourselves.
     */
    serverURL: string;
}
interface WebSocketContextType {
    sendMessage: (message: WebsocketMessage) => void;
    handleMessage: (callback: (incomingMessage: WebsocketMessage) => void) => () => void;
}
export interface WebsocketMessage {
    type: string;
    content: string;
    timestamp?: number;
}
/**
 * Sets up a websocket connnection and gives descendents access to it via the useWebSocket hook
 */
export declare const WebSocketProvider: React.FC<WebSocketProviderProps>;
export declare const useWebSocket: () => WebSocketContextType;
export {};
