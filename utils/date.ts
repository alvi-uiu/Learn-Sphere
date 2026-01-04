
import { formatDistanceToNow } from 'date-fns';

export const formatRelativeTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
        return 'Just now';
    }
};
