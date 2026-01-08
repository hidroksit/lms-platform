/**
 * Biometric Authentication Service
 * Face ID / Touch ID / Fingerprint
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = '@biometric_credentials';

class BiometricAuthService {
    private rnBiometrics = new ReactNativeBiometrics();

    /**
     * Check if biometrics is available
     */
    async isBiometricAvailable(): Promise<{
        available: boolean;
        biometryType: string | null;
    }> {
        try {
            const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

            let typeName = null;
            if (biometryType === BiometryTypes.FaceID) {
                typeName = 'Face ID';
            } else if (biometryType === BiometryTypes.TouchID) {
                typeName = 'Touch ID';
            } else if (biometryType === BiometryTypes.Biometrics) {
                typeName = 'Fingerprint';
            }

            return { available, biometryType: typeName };
        } catch (error) {
            console.error('Biometric check error:', error);
            return { available: false, biometryType: null };
        }
    }

    /**
     * Enable biometric authentication
     */
    async enableBiometric(email: string, password: string): Promise<boolean> {
        try {
            // Create signature keys
            const { publicKey } = await this.rnBiometrics.createKeys();

            // Store credentials (encrypted in production)
            await AsyncStorage.setItem(
                BIOMETRIC_CREDENTIALS_KEY,
                JSON.stringify({ email, password, publicKey })
            );

            await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

            return true;
        } catch (error) {
            console.error('Enable biometric error:', error);
            return false;
        }
    }

    /**
     * Authenticate with biometrics
     */
    async authenticate(): Promise<{
        success: boolean;
        credentials?: { email: string; password: string };
        error?: string;
    }> {
        try {
            const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

            if (enabled !== 'true') {
                return {
                    success: false,
                    error: 'Biometric authentication not enabled'
                };
            }

            // Prompt for biometric
            const { success } = await this.rnBiometrics.simplePrompt({
                promptMessage: 'Kimliğinizi Doğrulayın',
                cancelButtonText: 'İptal'
            });

            if (!success) {
                return {
                    success: false,
                    error: 'Authentication failed or cancelled'
                };
            }

            // Get stored credentials
            const credentialsJson = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);

            if (!credentialsJson) {
                return {
                    success: false,
                    error: 'No credentials found'
                };
            }

            const credentials = JSON.parse(credentialsJson);

            return {
                success: true,
                credentials: {
                    email: credentials.email,
                    password: credentials.password
                }
            };
        } catch (error) {
            console.error('Biometric auth error:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Disable biometric authentication
     */
    async disableBiometric(): Promise<void> {
        try {
            await this.rnBiometrics.deleteKeys();
            await AsyncStorage.multiRemove([
                BIOMETRIC_ENABLED_KEY,
                BIOMETRIC_CREDENTIALS_KEY
            ]);
        } catch (error) {
            console.error('Disable biometric error:', error);
        }
    }

    /**
     * Check if biometric is enabled
     */
    async isBiometricEnabled(): Promise<boolean> {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    }

    /**
     * Create signature (for advanced authentication)
     */
    async createSignature(payload: string): Promise<{
        success: boolean;
        signature?: string;
    }> {
        try {
            const { success, signature } = await this.rnBiometrics.createSignature({
                promptMessage: 'İşlemi Onaylayın',
                payload: payload
            });

            if (success && signature) {
                return { success: true, signature };
            }

            return { success: false };
        } catch (error) {
            console.error('Create signature error:', error);
            return { success: false };
        }
    }
}

export default new BiometricAuthService();
