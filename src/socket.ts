import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getNotifications, clear } from './services/notification.service';

export function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId as string;
        socket.join(userId);

        // Enviar notificaciones pendientes al conectar
        const msgs = getNotifications(userId);
        socket.emit('notifications', msgs);

        socket.on('markRead', () => {
            clear(userId);
        });
    });

    return io;
}