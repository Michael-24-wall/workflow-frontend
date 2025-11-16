class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  connect(spreadsheetId, onMessage, onError, onClose) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        onError && onError(new Error('No authentication token'));
        return;
      }

      // Use the correct WebSocket URL - now Daphne is running on port 9000
      const wsUrl = `ws://localhost:9000/ws/spreadsheet/${spreadsheetId}/?token=${token}`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Send connection established message
        this.send({
          action: 'heartbeat',
          timestamp: new Date().toISOString()
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${event.code} - ${event.reason}`);
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(spreadsheetId, onMessage, onError, onClose);
          }, this.reconnectInterval);
        } else {
          if (onClose) {
            onClose(event);
          }
        }
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      console.log('📤 WebSocket message sent:', data);
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return false;
    }
  }

  sendCellUpdate(cellData) {
    return this.send({
      action: 'cell_update',
      cell: cellData,
      timestamp: new Date().toISOString()
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  getReadyState() {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }
}

export default new WebSocketService();