// screens/LoginScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        try {
            const response = await axios.post(
                'http://10.0.2.2:3000/api/auth/login',
                { email, password }
            );
            const userData = response.data;
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            onLogin(userData);
        } catch (err) {
            console.error('Ошибка входа:', err);
            // TODO: показать ошибку пользователю
        }
    };

    return (
        <LinearGradient
            colors={['#10408A', '#4A90E2']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <Image
                    source={require('../assets/images/logo_auth.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Привет!</Text>
                <Text style={styles.subtitle}>Авторизируйся в LeadCRM</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#ccc"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Пароль"
                        placeholderTextColor="#ccc"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>ВОЙТИ</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    logo: {
        width: 48,
        height: 48,
        marginBottom: 130,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: 32,
        fontFamily: 'Roboto',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Roboto',
        color: '#fff',
        marginBottom: 32,
    },
    form: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: 16,
    },
    input: {
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 6,
        paddingHorizontal: 12,
        marginBottom: 12,
        fontFamily: 'Roboto',
        fontSize: 14,
        color: '#333',
    },
    button: {
        height: 48,
        backgroundColor: '#10408A',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Roboto',
        fontWeight: 'bold',
    },
});
