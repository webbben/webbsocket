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
    /**
     * Determines if websocket will automatically attempt to reconnect if its connection closes, for any reason.
     * Defaults to true.
     */
    autoReconnect?: boolean;
    /**
     * The maximum number of attempts at automatic reconnection; only applicable if autoReconnect is set to true.
     * Default is 5 attempts.
     */
    maxReconnectAttempts?: number;
    /**
     * The timeout between each automatic reconnection attempt; only applicable if autoReconnect is set to true.
     * Default is 5000 (5 seconds).
     */
    autoReconnectTimeout?: number;
}
interface WebSocketContextType {
    /**
     * Sends a message over websocket to your server.
     * @param message a message object containing the information to send over websocket.
     * * type property: meant to specify how the message should be handled on your server
     * (i.e., is this message a chat message to another user, or an update notification to sync with other clients, etc.)
     * * content property: meant to be the actual content of the message you want to send (the contents of a chat message, etc)
     */
    sendMessage: (message: WebsocketMessage) => void;
    /**
     * Registers a callback function to execute when a message is received; you can optionally filter which message types this callback responds to.
     * @param callback a callback function for when the websocket connection receives a message from the server
     * @param typeFilters optionally provide a list of types to filter messages based on - if the incoming message is one of these types, the message will be sent to the callback function.
     */
    handleMessage: (callback: (incomingMessage: WebsocketMessage) => void, typeFilters?: string[]) => () => void;
    /**
     * Whether the websocket connection is currently open; You can use this in useEffect dependency arrays to do things like setting message handler callback functions once the websocket connection is live.
     */
    connectionOpen: boolean;
}
/**
 * Basic properties of a message.
 */
export interface WebsocketMessage {
    /** The type of the message - for identifying its purpose and for special handling */
    type: string;
    /** The content of the message - the actual data payload to be communicated, whether its a chat message or a general data update */
    content: string;
    /** Timestamp of when this message was sent - if not set, it will be filled in by the Websocket Provider */
    timestamp?: number;
}
/**
 * Sets up a websocket connnection and gives descendents access to it via the useWebSocket hook
 */
export declare const WebSocketProvider: React.FC<WebSocketProviderProps>;
export declare const useWebSocket: () => WebSocketContextType;
export {};
