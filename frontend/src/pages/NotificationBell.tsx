// frontend/src/components/NotificationBell.tsx
import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";

type Notification = {
    id: number;
    sender: string;
    type: string;
    content: string;
    payload?: string;
    readFlag: boolean;
    createdAt: string;
};

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState<number>(0);

    useEffect(() => {
        // fetch initial
        (async () => {
            try {
                const res = await axios.get<Notification[]>("/api/notifications/me");
                setNotifications(res.data);
                setUnread(res.data.filter(n => !n.readFlag).length);
            } catch (e) {
                console.error("Failed load notifications", e);
            }
        })();

        // STOMP connect
        const socket = new SockJS('/ws-notifications');
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.debug(str),
            onConnect: () => {
                console.log("STOMP connected");
                // subscribe to admin topic
                client.subscribe('/topic/notifications/admin', (msg) => {
                    if (msg.body) {
                        const n: Notification = JSON.parse(msg.body);
                        setNotifications(prev => [n, ...prev]);
                        setUnread(prev => prev + 1);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker error', frame);
            }
        });
        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await axios.post(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? {...n, readFlag: true} : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Mark read failed", e);
        }
    };

    return (
        <div style={{position:"relative"}}>
            <button className="btn btn-light">
                🔔 {unread > 0 && <span className="badge bg-danger">{unread}</span>}
            </button>

            {/* dropdown mini */}
            <div style={{position:"absolute", right:0, marginTop:8, width:320, background:"white", boxShadow:"0 2px 8px rgba(0,0,0,0.12)", zIndex:2000}}>
                {notifications.length === 0 ? (
                    <div className="p-3">Nicio notificare</div>
                ) : (
                    <ul className="list-group">
                        {notifications.slice(0,10).map(n => (
                            <li key={n.id} className={"list-group-item d-flex justify-content-between align-items-start " + (n.readFlag ? "" : "fw-bold")}>
                                <div>
                                    <div>{n.content}</div>
                                    <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
                                </div>
                                {!n.readFlag && <button className="btn btn-sm btn-outline-primary" onClick={() => markAsRead(n.id)}>Marchează citit</button>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationBell;
