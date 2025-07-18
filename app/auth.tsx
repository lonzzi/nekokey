import { useAuth } from '@/lib/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const requestPermission = [
  'read:admin',
  'write:admin',

  'read:account',
  'read:blocks',
  'read:channels',
  'read:clip',
  'read:drive',
  'read:favorites',
  'read:federation',
  'read:flash',
  'read:following',
  'read:gallery',
  'read:invite',
  'read:messaging',
  'read:mutes',
  'read:notifications',
  'read:page',
  'read:pages',
  'read:reactions',
  'read:user',

  'write:account',
  'write:blocks',
  'write:channels',
  'write:clip',
  'write:drive',
  'write:favorites',
  'write:flash',
  'write:following',
  'write:gallery',
  'write:invite',
  'write:messaging',
  'write:mutes',
  'write:notes',
  'write:notifications',
  'write:page',
  'write:pages',
  'write:reactions',
  'write:report-abuse',
  'write:user',
  'write:votes',
].join(',');

export default function AuthScreen() {
  const { t } = useTranslation();
  const [server, setServer] = useState('');
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (processedServer: string) => {
      const sessionToken = Crypto.randomUUID();
      const authUrl = new URL(`${processedServer}/miauth/${sessionToken}`);
      authUrl.searchParams.set('name', 'nekokey');
      authUrl.searchParams.set('permission', requestPermission);
      authUrl.searchParams.set('callback', Linking.createURL('/auth'));

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        Linking.createURL('/auth'),
      );

      if (result.type !== 'success') {
        throw new Error(t('error.authProcessCanceled'));
      }

      const response = await fetch(`${processedServer}/api/miauth/${sessionToken}/check`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.token) {
        throw new Error(t('error.tokenFetchFailed'));
      }

      return { token: data.token, server: processedServer };
    },
    onSuccess: async ({ token, server }) => {
      await login(token, server);
      router.replace('/(tabs)/(home)');
    },
    onError: (error) => {
      console.error(t('error.authProcessError'), error);
      Alert.alert(t('error.title'), t('error.loginFailed'), [
        { text: t('common.ok'), style: 'default' },
      ]);
    },
  });

  const handleServerLogin = async () => {
    if (!server) {
      Alert.alert(t('error.title'), t('error.enterServerAddress'), [
        { text: t('common.ok'), style: 'default' },
      ]);
      return;
    }

    let processedServer = server.trim();
    if (!processedServer.startsWith('http://') && !processedServer.startsWith('https://')) {
      processedServer = `https://${processedServer}`;
    }

    loginMutation.mutate(processedServer);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('placeholder.serverAddress')}
        value={server}
        onChangeText={setServer}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity style={styles.button} onPress={handleServerLogin}>
        <Text style={styles.buttonText}>{t('common.login')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
