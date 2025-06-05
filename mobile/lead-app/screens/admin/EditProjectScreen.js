import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

export default function EditProjectScreen({ route, navigation }) {
    const { project, user } = route.params;
    const [name, setName] = useState(project.name);

    const handleSave = async () => {
        try {
            await axios.patch(`http://10.0.2.2:3000/api/projects/${project.id}`, { name }, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            Alert.alert('Успешно', 'Проект обновлён');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось сохранить проект');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`http://10.0.2.2:3000/api/projects/${project.id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            Alert.alert('Удалён', 'Проект удалён');
            navigation.navigate('ProjectList');
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось удалить проект');
        }
    };

    return (
        <View style={{ padding: 16 }}>
            <Text>Название проекта:</Text>
            <TextInput value={name} onChangeText={setName} style={{ borderBottomWidth: 1, marginBottom: 16 }} />
            <Button title="Сохранить" onPress={handleSave} />
            <View style={{ marginTop: 16 }}>
                <Button title="Удалить проект" onPress={handleDelete} color="red" />
            </View>
        </View>
    );
}
