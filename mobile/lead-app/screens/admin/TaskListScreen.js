import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TextInput,
    Button,
    Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

export default function TaskDetailScreen({ route }) {
    const { task, user } = route.params;
    const [status, setStatus] = useState(task.status);

    const handleStatusChange = async () => {
        try {
            await axios.patch(
                `http://10.0.2.2:3000/api/tasks/${task.id}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );
            Alert.alert('Успех', 'Статус задачи обновлён');
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось обновить статус');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Название:</Text>
            <Text style={styles.value}>{task.title}</Text>

            <Text style={styles.label}>Описание:</Text>
            <Text style={styles.value}>{task.description || '—'}</Text>

            <Text style={styles.label}>Срок выполнения:</Text>
            <Text style={styles.value}>{task.dueDate?.slice(0, 10)}</Text>

            <Text style={styles.label}>Исполнитель:</Text>
            <Text style={styles.value}>{task.assignedTo?.name || 'Не назначен'}</Text>

            <Text style={styles.label}>Статус:</Text>
            <Text style={styles.value}>{task.status}</Text>

            {task.report && (
                <>
                    <Text style={styles.label}>Отчёт:</Text>
                    <Text style={styles.value}>{task.report}</Text>
                </>
            )}

            {task.photoUrl && (
                <>
                    <Text style={styles.label}>Фотоотчёт:</Text>
                    <Image
                        source={{ uri: `http://10.0.2.2:3000/${task.photoUrl}` }}
                        style={styles.image}
                    />
                </>
            )}

            {user.role === 'ADMIN' && (
                <>
                    <Text style={styles.label}>Изменить статус:</Text>
                    <Picker
                        selectedValue={status}
                        onValueChange={(value) => setStatus(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Новая" value="Новая" />
                        <Picker.Item label="Принят к исполнению" value="Принят к исполнению" />
                        <Picker.Item label="Выполнен, требует проверки" value="Выполнен, требует проверки" />
                        <Picker.Item label="Закрыта" value="Закрыта" />
                    </Picker>
                    <Button title="Обновить статус" onPress={handleStatusChange} />
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    label: { fontWeight: 'bold', marginTop: 12 },
    value: { fontSize: 16, marginTop: 4 },
    image: { height: 200, width: '100%', marginTop: 12, borderRadius: 8 },
    picker: { backgroundColor: '#eee', marginTop: 8, marginBottom: 16 },
});
