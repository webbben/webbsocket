function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var WebSocketContext = React.createContext(undefined);
var WebSocketProvider = function WebSocketProvider(_ref) {
  var children = _ref.children,
    authToken = _ref.authToken,
    debug = _ref.debug,
    serverURL = _ref.serverURL,
    _ref$autoReconnect = _ref.autoReconnect,
    autoReconnect = _ref$autoReconnect === void 0 ? true : _ref$autoReconnect,
    _ref$maxReconnectAtte = _ref.maxReconnectAttempts,
    maxReconnectAttempts = _ref$maxReconnectAtte === void 0 ? 5 : _ref$maxReconnectAtte,
    _ref$autoReconnectTim = _ref.autoReconnectTimeout,
    autoReconnectTimeout = _ref$autoReconnectTim === void 0 ? 5000 : _ref$autoReconnectTim;
  var ws = React.useRef(null);
  var _useState = React.useState(false),
    connectionOpen = _useState[0],
    setConnectionOpen = _useState[1];
  var reconnectAttempts = React.useRef(0);
  var messageQueue = React.useRef([]);
  React.useEffect(function () {
    var initializeWebsocket = function initializeWebsocket() {
      ws.current = new WebSocket("ws://" + serverURL);
      ws.current.addEventListener('open', function (_event) {
        var _messageQueue$current;
        debugLogger('WebSocket: connection opened');
        setConnectionOpen(true);
        reconnectAttempts.current = 0;
        if (authToken) {
          var message = {
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
      ws.current.addEventListener('message', function (event) {
        debugLogger("Websocket: received message over websocket", event.data);
      });
      ws.current.addEventListener('close', function (_event) {
        debugLogger('WebSocket: connection closed');
        setConnectionOpen(false);
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          debugLogger("Websocket: attempting to reconnect...", reconnectAttempts);
          setTimeout(initializeWebsocket, autoReconnectTimeout);
        } else {
          console.error("Websocket: failed to establish connection with server. Please check that your server is configured to receive websocket connections.");
        }
      });
      ws.current.addEventListener('error', function (error) {
        debugLogger('WebSocket: error', error);
      });
    };
    initializeWebsocket();
    return function () {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);
  var debugLogger = function debugLogger() {
    var _console;
    if (!debug) {
      return;
    }
    (_console = console).log.apply(_console, arguments);
  };
  var sendMessage = function sendMessage(msg) {
    if (!msg.timestamp) {
      msg.timestamp = Date.now();
    }
    sendWebsocketMessage(msg);
  };
  var sendWebsocketMessage = function sendWebsocketMessage(msg) {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("Websocket: connection isn't open - Message queued to send later.");
      enqueueMessage(msg);
      return;
    }
    ws.current.send(JSON.stringify(msg));
    debugLogger("Websocket: sent message", msg);
    return;
  };
  var enqueueMessage = function enqueueMessage(msg) {
    if (!messageQueue.current) {
      messageQueue.current = [];
    }
    messageQueue.current.push(msg);
  };
  var sendQueuedMessages = function sendQueuedMessages() {
    if (!messageQueue.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }
    debugLogger("Websocket: dequeuing messages to resend...");
    var messages = [].concat(messageQueue.current);
    messageQueue.current = [];
    for (var _iterator = _createForOfIteratorHelperLoose(messages), _step; !(_step = _iterator()).done;) {
      var msg = _step.value;
      sendWebsocketMessage(msg);
    }
  };
  var handleMessage = function handleMessage(callback, typeFilters) {
    var listener = function listener(event) {
      var receivedMessage = JSON.parse(event.data);
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
      var logMessage = "Websocket: listening for messages";
      if (typeFilters) logMessage += " of the following types: " + typeFilters;
      debugLogger(logMessage);
    }
    return function () {
      var _ws$current;
      (_ws$current = ws.current) === null || _ws$current === void 0 ? void 0 : _ws$current.removeEventListener('message', listener);
    };
  };
  var contextValue = {
    sendMessage: sendMessage,
    handleMessage: handleMessage,
    connectionOpen: connectionOpen
  };
  return React__default.createElement(WebSocketContext.Provider, {
    value: contextValue
  }, children);
};
var useWebSocket = function useWebSocket() {
  var context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

exports.WebSocketProvider = WebSocketProvider;
exports.useWebSocket = useWebSocket;
//# sourceMappingURL=index.js.map
