export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'budget_overspent' | 'goal_completed';
    createdAt: Date;
}

const queue: Notification[] = [];
let idCounter = 0;

export function enqueue(
    userId: string,
    message: string,
    type: Notification['type']
) {
    queue.push({
        id: (++idCounter).toString(),
        userId,
        message,
        type,
        createdAt: new Date(),
    });
}

export function getNotifications(userId: string): Notification[] {
    return queue.filter(n => n.userId === userId).slice(-20); // últimas 20
}

export function clear(userId: string) {
    // elimina solo las del usuario
    for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].userId === userId) queue.splice(i, 1);
    }
}