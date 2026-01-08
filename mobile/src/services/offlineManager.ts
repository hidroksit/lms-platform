/**
 * Offline Manager Service
 * Manages offline content caching and synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineContent {
    id: string;
    type: 'course' | 'video' | 'pdf' | 'exam';
    title: string;
    data: any;
    downloadedAt: string;
    size: number;
}

interface SyncQueueItem {
    id: string;
    action: 'submit_exam' | 'update_progress' | 'post_comment';
    data: any;
    timestamp: string;
}

const STORAGE_KEYS = {
    OFFLINE_CONTENT: '@offline_content',
    SYNC_QUEUE: '@sync_queue',
    LAST_SYNC: '@last_sync',
    OFFLINE_MODE: '@offline_mode'
};

class OfflineManager {
    /**
     * Check if device is offline
     */
    async isOffline(): Promise<boolean> {
        const mode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
        return mode === 'true';
    }

    /**
     * Enable offline mode
     */
    async enableOfflineMode(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'true');
    }

    /**
     * Disable offline mode
     */
    async disableOfflineMode(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'false');
    }

    /**
     * Download content for offline access
     */
    async downloadContent(content: {
        id: string;
        type: 'course' | 'video' | 'pdf' | 'exam';
        title: string;
        url: string;
    }): Promise<boolean> {
        try {
            // Fetch content from API
            const response = await fetch(content.url);
            const data = await response.json();

            const offlineContent: OfflineContent = {
                id: content.id,
                type: content.type,
                title: content.title,
                data: data,
                downloadedAt: new Date().toISOString(),
                size: JSON.stringify(data).length
            };

            // Store in AsyncStorage
            const existing = await this.getOfflineContent();
            existing.push(offlineContent);
            await AsyncStorage.setItem(
                STORAGE_KEYS.OFFLINE_CONTENT,
                JSON.stringify(existing)
            );

            return true;
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }

    /**
     * Get all offline content
     */
    async getOfflineContent(): Promise<OfflineContent[]> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CONTENT);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Get single offline content by ID
     */
    async getContentById(id: string): Promise<OfflineContent | null> {
        const content = await this.getOfflineContent();
        return content.find(c => c.id === id) || null;
    }

    /**
     * Delete offline content
     */
    async deleteContent(id: string): Promise<void> {
        const content = await this.getOfflineContent();
        const filtered = content.filter(c => c.id !== id);
        await AsyncStorage.setItem(
            STORAGE_KEYS.OFFLINE_CONTENT,
            JSON.stringify(filtered)
        );
    }

    /**
     * Add item to sync queue (for actions performed while offline)
     */
    async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
        const queue = await this.getSyncQueue();

        const queueItem: SyncQueueItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...item
        };

        queue.push(queueItem);
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }

    /**
     * Get sync queue
     */
    async getSyncQueue(): Promise<SyncQueueItem[]> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Sync queued items with server
     */
    async syncWithServer(apiUrl: string, token: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }> {
        const queue = await this.getSyncQueue();
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const item of queue) {
            try {
                let endpoint = '';
                let method = 'POST';

                switch (item.action) {
                    case 'submit_exam':
                        endpoint = '/api/exams/submit';
                        break;
                    case 'update_progress':
                        endpoint = '/api/progress/update';
                        break;
                    case 'post_comment':
                        endpoint = '/api/comments';
                        break;
                }

                const response = await fetch(`${apiUrl}${endpoint}`, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(item.data)
                });

                if (response.ok) {
                    success++;
                } else {
                    failed++;
                    errors.push(`${item.action}: ${response.statusText}`);
                }
            } catch (error) {
                failed++;
                errors.push(`${item.action}: ${(error as Error).message}`);
            }
        }

        // Clear synced items
        if (success > 0) {
            await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        }

        return { success, failed, errors };
    }

    /**
     * Get total offline storage size
     */
    async getStorageSize(): Promise<number> {
        const content = await this.getOfflineContent();
        return content.reduce((total, item) => total + item.size, 0);
    }

    /**
     * Clear all offline data
     */
    async clearAllOfflineData(): Promise<void> {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.OFFLINE_CONTENT,
            STORAGE_KEYS.SYNC_QUEUE
        ]);
    }

    /**
     * Get last sync time
     */
    async getLastSyncTime(): Promise<string | null> {
        return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    }
}

export default new OfflineManager();
