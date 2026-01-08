/**
 * Push Notification Service for Mobile App
 * Uses Firebase Cloud Messaging (FCM) for Android and APNS for iOS
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';

class PushNotificationService {
    /**
     * Request notification permissions
     */
    async requestPermission(): Promise<boolean> {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Notification permission granted');
                await this.getFCMToken();
                return true;
            } else {
                console.log('Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Permission request error:', error);
            return false;
        }
    }

    /**
     * Get FCM token and save it
     */
    async getFCMToken(): Promise<string | null> {
        try {
            const token = await messaging().getToken();

            if (token) {
                console.log('FCM Token:', token);
                await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
                return token;
            }

            return null;
        } catch (error) {
            console.error('Get token error:', error);
            return null;
        }
    }

    /**
     * Send FCM token to backend
     */
    async registerTokenWithBackend(userId: string, apiUrl: string, authToken: string): Promise<boolean> {
        try {
            const fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

            if (!fcmToken) {
                console.error('No FCM token available');
                return false;
            }

            const response = await fetch(`${apiUrl}/api/notifications/register-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    userId,
                    fcmToken,
                    platform: Platform.OS
                })
            });

            if (response.ok) {
                console.log('Device registered for notifications');
                return true;
            } else {
                console.error('Failed to register device');
                return false;
            }
        } catch (error) {
            console.error('Register token error:', error);
            return false;
        }
    }

    /**
     * Setup notification listeners
     */
    setupNotificationListeners(): void {
        // Foreground notifications
        messaging().onMessage(async remoteMessage => {
            console.log('Foreground notification:', remoteMessage);

            Alert.alert(
                remoteMessage.notification?.title || 'Bildirim',
                remoteMessage.notification?.body || '',
                [{ text: 'Tamam' }]
            );
        });

        // Background/Quit state notifications
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Background notification:', remoteMessage);
        });

        // Notification opened (app was in background)
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification opened app:', remoteMessage);
            this.handleNotificationAction(remoteMessage);
        });

        // Check if app was opened from a notification (app was quit)
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('App opened from notification:', remoteMessage);
                    this.handleNotificationAction(remoteMessage);
                }
            });

        // Token refresh listener
        messaging().onTokenRefresh(token => {
            console.log('FCM token refreshed:', token);
            AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        });
    }

    /**
     * Handle notification action (navigate to specific screen)
     */
    handleNotificationAction(remoteMessage: any): void {
        const { data } = remoteMessage;

        if (data?.type === 'exam_reminder') {
            // Navigate to exam screen
            console.log('Navigate to exam:', data.examId);
        } else if (data?.type === 'grade_published') {
            // Navigate to grades screen
            console.log(' Navigate to grades');
        } else if (data?.type === 'course_enrollment') {
            // Navigate to course
            console.log('Navigate to course:', data.courseId);
        }
    }

    /**
     * Subscribe to topic (for broadcast notifications)
     */
    async subscribeToTopic(topic: string): Promise<void> {
        try {
            await messaging().subscribeToTopic(topic);
            console.log(`Subscribed to topic: ${topic}`);
        } catch (error) {
            console.error('Subscribe error:', error);
        }
    }

    /**
     * Unsubscribe from topic
     */
    async unsubscribeFromTopic(topic: string): Promise<void> {
        try {
            await messaging().unsubscribeFromTopic(topic);
            console.log(`Unsubscribed from topic: ${topic}`);
        } catch (error) {
            console.error('Unsubscribe error:', error);
        }
    }

    /**
     * Get notification badge count (iOS)
     */
    async getBadgeCount(): Promise<number> {
        if (Platform.OS === 'ios') {
            return await messaging().getAPNSToken() ? 0 : 0; // Simplified
        }
        return 0;
    }

    /**
     * Set notification badge count (iOS)
     */
    async setBadgeCount(count: number): Promise<void> {
        if (Platform.OS === 'ios') {
            // Would use native module in production
            console.log('Set badge count:', count);
        }
    }

    /**
     * Clear all notifications
     */
    async clearNotifications(): Promise<void> {
        // iOS
        if (Platform.OS === 'ios') {
            await this.setBadgeCount(0);
        }

        // Android - would use native module
        console.log('Notifications cleared');
    }
}

export default new PushNotificationService();
