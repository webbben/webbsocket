import React from 'react';
import { WebSocketProvider } from 'webbsocket';
import WebsocketReceiver from './WebsocketReceiver';

const App = () => {
  return (
    <WebSocketProvider serverURL='localhost:8080/ws' debug>
      <WebsocketReceiver />
    </WebSocketProvider>
  );
}

export default App
