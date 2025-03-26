import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const App = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [translatedMessage, setTranslatedMessage] = useState('');
    const [inCall, setInCall] = useState(false);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);

    useEffect(() => {
        socket.on('chatMessage', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        socket.on('offer', async (offer) => {
            const pc = createPeerConnection();
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', answer);
        });

        socket.on('answer', async (answer) => {
            await peerConnectionRef.current.setRemoteDescription(answer);
        });

        socket.on('ice-candidate', async (candidate) => {
            await peerConnectionRef.current.addIceCandidate(candidate);
        });

        return () => {
            socket.off('chatMessage');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, []);

    const startCall = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection();
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('offer', offer);
        setInCall(true);
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        return pc;
    };

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit('chatMessage', message);
            setMessage('');
        }
    };

    const translateMessage = async (text) => {
        try {
            const response = await axios.post('http://localhost:5000/translate', { text, targetLang: 'en' });
            setTranslatedMessage(response.data.translatedText);
        } catch (error) {
            console.error('Translation error:', error);
        }
    };

    return (
        <div>
            <h1>Collaboration App</h1>

            <div>
                <h2>Video Call</h2>
                {inCall ? (
                    <>
                        <video ref={localVideoRef} autoPlay playsInline muted />
                        <video ref={remoteVideoRef} autoPlay playsInline />
                    </>
                ) : (
                    <button onClick={startCall}>Start Video Call</button>
                )}
            </div>

            <div>
                <h2>Chat</h2>
                <div>
                    {messages.map((msg, idx) => (
                        <div key={idx}>{msg}</div>
                    ))}
                </div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>

            <div>
                <h2>Translate Message</h2>
                <input type="text" placeholder="Enter text" onBlur={(e) => translateMessage(e.target.value)} />
                {translatedMessage && <p>Translation: {translatedMessage}</p>}
            </div>
        </div>
    );
};

export default App;
