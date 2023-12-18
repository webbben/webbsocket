# webbsocket

> Ben Webb's very own React websocket provider package (for some reason the name makes me giggle too)

[![NPM](https://img.shields.io/npm/v/webbsocket.svg)](https://www.npmjs.com/package/webbsocket) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[Github Repo](https://github.com/webbben/webbsocket)

## Install

```bash
npm install --save @webbben/webbsocket
```

## Usage

Below is an example of a very basic usage of this websocket provider component. If you'd like to test it out, you can use the code directly from the github repo's example folder: https://github.com/webbben/webbsocket/tree/master/example

```tsx
// Step 1: WebSocketProvider
// Wrap the WebSocketProvider component around your components you wish to provide websocket context access to:

import { WebSocketProvider } from 'webbsocket';
import WebsocketReceiver from './WebsocketReceiver'; // (descendents to provide websocket access to)

const App = () => {

  // provide the URL your server is hosted on, including the specific API endpoint for handling websocket connections.
  // if your app needs granularity for multiple websocket connections, consider adding URL params/variables
  return (
    <WebSocketProvider serverURL='localhost:8080/ws'>
      <WebsocketReceiver />
    </WebSocketProvider>
  );
}
```

```tsx
// Step 2: Your components that access websocket
// Example of basic implementation of websocket, for a component that is a descendent of WebSocketProvider.
import React, { useEffect, useState } from "react";
import { useWebSocket } from "webbsocket";

export default function WebsocketReceiver() {
    const [serverResponse, setServerResponse] = useState('');

    // import the functions you'd like to use from the websocket context
    const { sendMessage, handleMessage, connectionOpen } = useWebSocket();

    // send messages to the server
    function broadcastMessage() {
        sendMessage({
            type: "message_from_client",
            content: "hello world",
        });
    }

    // handle messages from the server by subscribing a callback function
    useEffect(() => {
        // ensure the connection is open before subscribing a callback
        if (!connectionOpen) {
            return;
        }

        const unsub = handleMessage((msg) => {
            console.log(msg);
            setServerResponse(msg.content);
        });

        return () => {
            // cleanup subscriptions when component unmounts, to prevent memory leaks.
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
```

## Server Side
This package of course assumes you have a server listening for websocket requests, and handling all the backend side of things, like handling messages from the client and responding to the client, etc.

The basic message this websocket client sends to the server is a JSON with the following:
* type - the type of message, which may specify its purpose. meant to be used when handling the message either on the server or client. You can add special handling on the client for different types when subscribing message handler callbacks.
* content - the content of the message, i.e. the message sent by a user in a chatroom, or the update to send to other clients, etc.
* timestamp - the timestamp of when this message was sent from its origin. useful for keeping track of the order of messages if needed.

This package was written with these expected properties in mind, but you can of course add more properties to suit your needs.

If you'd like to see an example of a server communicating with this websocket provider package, see the example/server folder in the github repo: https://github.com/webbben/webbsocket/tree/master/example

To run the go server, enter this in the command prompt in the server directory:

```bash
go run main.go
```

## Features and Configuration
### WebSocketProvider props and configuration
Here are the props you can add when using the WebSocketProvider component:

* `serverURL` (REQ) - URL of the server/port/endpoint listening for this websocket connection, e.g. "localhost:8080/ws/endpoint". Note: do not include any protocols (http, https, ws, etc). We add the 'ws' protocol in ourselves. If you'd like to add more granularity to websocket connections with your server, consider adding variables or params to the URL.
* `debug` (OPT) - Enables printing debug statements to the console; useful if you want to investigate issues with this websocket provider. Warnings and errors will be printed to the console regardless of this setting.
* `authToken` (OPT) - JWT auth token to be sent to the server, if you'd like to authorize your websocket clients. If provided, will be sent as a message of type "authorization" after initial connection is established. The server should wait for this authorization message and verify the token (stored in the message content) before trusting a websocket connection.
* `autoReconnect` (OPT) - Determines if websocket will automatically attempt to reconnect if its connection closes (while WebSocketProvider is still mounted), for any reason. Defaults to true.
* `maxReconnectAttempts` (OPT) - The maximum number of attempts at automatic reconnection; only applicable if autoReconnect is set to true. Default is 5 attempts.
* `autoReconnectTimeout` (OPT) - The timeout between each automatic reconnection attempt; only applicable if autoReconnect is set to true. Default is 5000 (5 seconds).

## License

MIT © [webbben](https://github.com/webbben)
