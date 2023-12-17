import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";

interface WebSocketProviderProps {
    children: ReactNode
    /** JWT auth token to be sent to the server, if you'd like to authorize your websocket clients.
     * 
     * If provided, will be sent as a message of type "authorization" after initial connection is established.
     * The server should wait for this authorization message and verify the token (stored in the message "content") before
     * trusting a websocket connection.
     */
    authToken?: string
    /** Enables printing debug statements to the console; useful if you want to investigate issues with this websocket provider. 
     * 
     * Warnings and errors will be printed to the console regardless of this setting.
     */
    debug?: boolean
    /**
     * URL of the server/port/endpoint listening for this websocket connection, e.g. "localhost:8080/ws/endpoint".
     * 
     * Note: do not include any protocols (http, https, ws, etc). We add the 'ws' protocol in ourselves.
     */
    serverURL: string
    /**
     * Determines if websocket will automatically attempt to reconnect if its connection closes, for any reason.
     * Defaults to true.
     */
    autoReconnect?: boolean
    /**
     * The maximum number of attempts at automatic reconnection; only applicable if autoReconnect is set to true.
     * Default is 5 attempts.
     */
    maxReconnectAttempts?: number
    /**
     * The timeout between each automatic reconnection attempt; only applicable if autoReconnect is set to true.
     */
    autoReconnectTimeout?: number

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
    type: string,
    /** The content of the message - the actual data payload to be communicated, whether its a chat message or a general data update */
    content: string,
    /** Timestamp of when this message was sent - if not set, it will be filled in by the Websocket Provider */
    timestamp?: number
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * Sets up a websocket connnection and gives descendents access to it via the useWebSocket hook
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, authToken, debug, serverURL, autoReconnect = true, maxReconnectAttempts = 5, autoReconnectTimeout = 5000 }) => {

    const ws = useRef<WebSocket | null>(null);
    const [connectionOpen, setConnectionOpen] = useState(false);
    const reconnectAttempts = useRef<number>(0);
    const messageQueue = useRef<WebsocketMessage[]>([]); // enqueue messages if they are unable to be sent

    useEffect(() => {
        const initializeWebsocket = () => {
            ws.current = new WebSocket(`ws://${serverURL}`);

            ws.current.addEventListener('open', (_event) => {
                debugLogger('WebSocket: connection opened');
                setConnectionOpen(true);
                reconnectAttempts.current = 0;
                // send auth info
                if (authToken) {
                    const message: WebsocketMessage = {
                        type: "authorization",
                        content: authToken,
                        timestamp: Date.now()
                    }
                    sendWebsocketMessage(message);
                }
                // check for queued messages
                if (messageQueue.current?.length > 0) {
                    sendQueuedMessages();
                }
            });

            ws.current.addEventListener('message', (event) => {
                debugLogger("Websocket: received message over websocket", event.data);
            });
 
            ws.current.addEventListener('close', (_event) => {
                debugLogger('WebSocket: connection closed');
                setConnectionOpen(false);
                if (autoReconnect && (reconnectAttempts.current < maxReconnectAttempts)) {
                    reconnectAttempts.current++;
                    debugLogger("Websocket: attempting to reconnect...", reconnectAttempts);
                    setTimeout(initializeWebsocket, autoReconnectTimeout);
                }
                else {
                    console.error("Websocket: failed to establish connection with server. Please check that your server is configured to receive websocket connections.");
                }
            });

            ws.current.addEventListener('error', (error) => {
                debugLogger('WebSocket: error', error);
            });
        }
        initializeWebsocket();

        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        };
    }, []);

    const debugLogger = (...args: any[]) => {
        if (!debug) {
            return;
        }
        console.log(...args);
    }

    /* handles sending a chat message over websocket */
    const sendMessage = (msg: WebsocketMessage) => {
        if (!msg.timestamp) {
            msg.timestamp = Date.now();
        }
        sendWebsocketMessage(msg);
    };

    const sendWebsocketMessage = (msg: WebsocketMessage) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.warn("Websocket: connection isn't open - Message queued to send later.");
            enqueueMessage(msg);
            return;
        }
        ws.current.send(JSON.stringify(msg));
        debugLogger("Websocket: sent message", msg);
        return;
    }

    const enqueueMessage = (msg: WebsocketMessage) => {
        if (!messageQueue.current) {
            messageQueue.current = [];
        }
        messageQueue.current.push(msg);
    }

    const sendQueuedMessages = () => {
        if (!messageQueue.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return;
        }
        debugLogger("Websocket: dequeuing messages to resend...");
        const messages = [...messageQueue.current];
        messageQueue.current = [];
        for (const msg of messages) {
            sendWebsocketMessage(msg);
        }
    }

    /**
     * function for subscribing and setting the callback behavior for when messages are received over websocket. returns the unsubscribe function, for cleanup.
     * @param callback a callback function for handling when messages are received over websocket. probably for updating state in the consuming component.
     * @param typeFilters optional param to filter which type of message to listen for - if any messages dont match the types in this array, they will be ignored by this listener.
     * @returns an unsubscribe function to stop listening for messages; call this function when the component unmounts to prevent memory leaks.
     */
    const handleMessage = (callback: (incomingMessage: WebsocketMessage) => void, typeFilters?: string[]) => {
        const listener = (event: MessageEvent) => {
            const receivedMessage = JSON.parse(event.data);
            debugLogger("Websocket: incoming message to your listener", receivedMessage);
            if (typeFilters && !typeFilters.includes(receivedMessage.type)) {
                return;
            }
            debugLogger('Sending this message to your registered callback.');
            callback(receivedMessage as WebsocketMessage);
        };

        if (!ws.current) {
            console.warn("Websocket: failed to add message listener due to websocket being unavailable.");
        }
        else {
            ws.current.addEventListener('message', listener);
            let logMessage = "Websocket: listening for messages";
            if (typeFilters) logMessage += ` of the following types: ${typeFilters}`;
            debugLogger(logMessage);
        }
    
        // Return a cleanup function to unsubscribe when needed
        return () => {
            ws.current?.removeEventListener('message', listener);
        };
    };

    const contextValue: WebSocketContextType = {
        sendMessage,
        handleMessage,
        connectionOpen
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            { children } 
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};