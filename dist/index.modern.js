import React, { createContext, useRef, useState, useEffect, useContext } from 'react';

const WebSocketContext = createContext(undefined);
const WebSocketProvider = ({
  children,
  authToken,
  debug,
  serverURL,
  autoReconnect: _autoReconnect = true,
  maxReconnectAttempts: _maxReconnectAttempts = 5,
  autoReconnectTimeout: _autoReconnectTimeout = 5000
}) => {
  const ws = useRef(null);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const reconnectAttempts = useRef(0);
  const messageQueue = useRef([]);
  useEffect(() => {
    const initializeWebsocket = () => {
      ws.current = new WebSocket(`ws://${serverURL}`);
      ws.current.addEventListener('open', _event => {
        var _messageQueue$current;
        debugLogger('WebSocket: connection opened');
        setConnectionOpen(true);
        reconnectAttempts.current = 0;
        if (authToken) {
          const message = {
            type: "authorization",
            content: authToken,
            timestamp: Date.now()
          };
          sendWebsocketMessage(message);
        }
        if (((_messageQueue$current = messageQueue.current) === null || _messageQueue$current === void 0 ? void 0 : _messageQueue$current.length) > 0) {
          sendQueuedMessages();
        }
      });
      ws.current.addEventListener('message', event => {
        debugLogger("Websocket: received message over websocket", event.data);
      });
      ws.current.addEventListener('close', _event => {
        debugLogger('WebSocket: connection closed');
        setConnectionOpen(false);
        if (_autoReconnect && reconnectAttempts.current < _maxReconnectAttempts) {
          reconnectAttempts.current++;
          debugLogger("Websocket: attempting to reconnect...", reconnectAttempts);
          setTimeout(initializeWebsocket, _autoReconnectTimeout);
        } else {
          console.error("Websocket: failed to establish connection with server. Please check that your server is configured to receive websocket connections.");
        }
      });
      ws.current.addEventListener('error', error => {
        debugLogger('WebSocket: error', error);
      });
    };
    initializeWebsocket();
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);
  const debugLogger = (...args) => {
    if (!debug) {
      return;
    }
    console.log(...args);
  };
  const sendMessage = msg => {
    if (!msg.timestamp) {
      msg.timestamp = Date.now();
    }
    sendWebsocketMessage(msg);
  };
  const sendWebsocketMessage = msg => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("Websocket: connection isn't open - Message queued to send later.");
      enqueueMessage(msg);
      return;
    }
    ws.current.send(JSON.stringify(msg));
    debugLogger("Websocket: sent message", msg);
    return;
  };
  const enqueueMessage = msg => {
    if (!messageQueue.current) {
      messageQueue.current = [];
    }
    messageQueue.current.push(msg);
  };
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
  };
  const handleMessage = (callback, typeFilters) => {
    const listener = event => {
      const receivedMessage = JSON.parse(event.data);
      debugLogger("Websocket: incoming message to your listener", receivedMessage);
      if (typeFilters && !typeFilters.includes(receivedMessage.type)) {
        return;
      }
      debugLogger('Sending this message to your registered callback.');
      callback(receivedMessage);
    };
    if (!ws.current) {
      console.warn("Websocket: failed to add message listener due to websocket being unavailable.");
    } else {
      ws.current.addEventListener('message', listener);
      let logMessage = "Websocket: listening for messages";
      if (typeFilters) logMessage += ` of the following types: ${typeFilters}`;
      debugLogger(logMessage);
    }
    return () => {
      var _ws$current;
      (_ws$current = ws.current) === null || _ws$current === void 0 ? void 0 : _ws$current.removeEventListener('message', listener);
    };
  };
  const contextValue = {
    sendMessage,
    handleMessage,
    connectionOpen
  };
  return React.createElement(WebSocketContext.Provider, {
    value: contextValue
  }, children);
};
const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export { WebSocketProvider, useWebSocket };
//# sourceMappingURL=index.modern.js.map
