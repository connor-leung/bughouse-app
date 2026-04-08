package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMsgSize = 8192
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Envelope is the wire format for all messages.
type Envelope struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

// Client wraps a WebSocket connection with thread-safe send.
type Client struct {
	UserID      string
	DisplayName string
	conn        *websocket.Conn
	send        chan []byte
	once        sync.Once
}

func Upgrade(w http.ResponseWriter, r *http.Request) (*Client, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return nil, err
	}
	return &Client{
		UserID: r.URL.Query().Get("userId"),
		conn:   conn,
		send:   make(chan []byte, 64),
	}, nil
}

// Send queues a message for the client. Non-blocking; drops if buffer full.
func (c *Client) Send(msgType string, data any) {
	raw, err := json.Marshal(data)
	if err != nil {
		log.Printf("marshal error: %v", err)
		return
	}
	env := Envelope{Type: msgType, Data: raw}
	b, _ := json.Marshal(env)
	select {
	case c.send <- b:
	default:
		log.Printf("client %s send buffer full, dropping message", c.UserID)
	}
}

// WritePump pumps messages from the send channel to the WebSocket.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ReadPump reads messages from the WebSocket and calls onMsg for each.
// Blocks until the connection closes.
func (c *Client) ReadPump(onMsg func(Envelope)) {
	defer c.Close()
	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		var env Envelope
		if err := json.Unmarshal(raw, &env); err != nil {
			continue
		}
		onMsg(env)
	}
}

// Close drains the send channel and closes the connection once.
func (c *Client) Close() {
	c.once.Do(func() {
		close(c.send)
		c.conn.Close()
	})
}
