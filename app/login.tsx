import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
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

export default function LoginScreen() {
  const [server, setServer] = useState('');

  const handleServerLogin = async () => {
    if (!server) {
      Alert.alert('错误', '请输入服务器地址', [{ text: '确定', style: 'default' }]);
      return;
    }

    let processedServer = server.trim();
    if (!processedServer.startsWith('http://') && !processedServer.startsWith('https://')) {
      processedServer = `https://${processedServer}`;
    }

    try {
      // 创建认证 URL
      const sessionToken = Crypto.randomUUID();
      const authUrl = new URL(`${processedServer}/miauth/${sessionToken}`);
      authUrl.searchParams.set('name', 'nekokey');
      authUrl.searchParams.set('permission', requestPermission);
      authUrl.searchParams.set('callback', Linking.createURL('/miauth'));

      // 使用 WebBrowser 打开认证链接
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        Linking.createURL('/miauth'),
      );

      if (result.type === 'success') {
        // 验证认证结果
        const response = await fetch(`${processedServer}/api/miauth/${sessionToken}/check`, {
          method: 'POST',
        });

        const data = await response.json();
        if (data.token) {
          console.log('认证成功，获取到令牌', data.token);
          await AsyncStorage.setItem('server', processedServer);
          await AsyncStorage.setItem('token', data.token);
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('认证过程发生错误:', error);
    }
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
        placeholder="Misskey 服务器地址"
        value={server}
        onChangeText={setServer}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity style={styles.button} onPress={handleServerLogin}>
        <Text style={styles.buttonText}>登录</Text>
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
