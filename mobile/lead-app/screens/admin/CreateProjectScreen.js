import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

export default function CreateProjectScreen({ navigation, user }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleCreate = async () => {
        try {

            await axios.post(`http://10.0.2.2:3000/api/projects`, {
                name,
                description,
                budget,
                deadline, // ← строка вида "2025-07-01"
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            Alert.alert('Проект создан');
            navigation.goBack();
        } catch (err) {
            console.error('Ошибка создания проекта:', err.message);
            Alert.alert('Ошибка', 'Не удалось создать проект');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>Название проекта:</Text>
            <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />

            <Text>Описание:</Text>
            <TextInput value={description} onChangeText={setDescription} style={{ borderWidth: 1, marginBottom: 10 }} />

            <Text>Бюджет:</Text>
            <TextInput
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                style={{ borderWidth: 1, marginBottom: 10 }}
            />

            <Text>Срок сдачи (в формате ГГГГ-ММ-ДД):</Text>
            <TextInput value={deadline} onChangeText={setDeadline} style={{ borderWidth: 1, marginBottom: 20 }} />

            <Button title="Создать проект" onPress={handleCreate} />
        </View>
    );
}
