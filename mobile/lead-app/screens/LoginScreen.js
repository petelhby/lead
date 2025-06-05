import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        try {
            console.log('Пробуем войти:', email, password);

            const res = await axios.post('http://10.0.2.2:3000/api/auth/login', {
                email,
                password,
            });
            const token = res.data.token;
            const user = res.data.user;
            onLogin({ ...user, token });
        } catch (err) {
            console.log('Ошибка:', err.response?.data || err.message);
            setError('Ошибка входа');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>Email:</Text>
            <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1 }} />
            <Text>Пароль:</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1 }} />
            <Button title="Войти" onPress={handleSubmit} />
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
        </View>
    );
}
