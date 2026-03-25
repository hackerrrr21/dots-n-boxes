window.Network = {
    peer: null,
    conn: null,
    isHost: false,
    isConnected: false,

    generateShortId: function() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    initHost: function(onReady, onConnect, onData) {
        this.isHost = true;
        const shortId = this.generateShortId();
        
        // Connect to PeerJS server with robust ICE servers for cross-network (TURN)
        const peerConfig = {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
                    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
                    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
                ]
            }
        };
        this.peer = new Peer(shortId, peerConfig);
        
        this.peer.on('open', (id) => {
            onReady(id);
        });

        this.peer.on('connection', (conn) => {
            if (this.isConnected) {
                // Reject if already connected to a player
                conn.close();
                return;
            }
            this.conn = conn;
            this.setupConnection(onConnect, onData);
        });

        this.peer.on('error', (err) => {
            console.error("PeerJS Error:", err);
            if (err.type === 'unavailable-id') {
                // ID taken, try again
                this.peer.destroy();
                this.initHost(onReady, onConnect, onData);
            }
        });
    },

    initGuest: function(hostId, onConnect, onData, onError) {
        this.isHost = false;
        
        const peerConfig = {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
                    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
                    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
                ]
            }
        };
        this.peer = new Peer(peerConfig);
        
        this.peer.on('open', () => {
            this.conn = this.peer.connect(hostId.toUpperCase(), { reliable: true });
            this.setupConnection(onConnect, onData);
            
            this.conn.on('error', (err) => {
                onError && onError(err);
            });
        });
        
        this.peer.on('error', (err) => {
            console.error("PeerJS Guest Error:", err);
            onError && onError(err);
        });
    },

    setupConnection: function(onConnect, onData) {
        this.conn.on('open', () => {
            this.isConnected = true;
            onConnect();
        });

        this.conn.on('data', (data) => {
            onData(data);
        });

        this.conn.on('close', () => {
            this.isConnected = false;
            alert("Connection lost with the other player.");
            window.location.reload();
        });
    },

    send: function(data) {
        if(this.isConnected && this.conn) {
            this.conn.send(data);
        }
    },

    disconnect: function() {
        if(this.conn) {
            this.conn.close();
        }
        if(this.peer) {
            this.peer.destroy();
        }
        this.isConnected = false;
        this.conn = null;
        this.peer = null;
    }
};
