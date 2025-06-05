import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Picker,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const AssignTaskScreen = ({ route, navigation }) => {
    const { project, user } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedToId, setAssignedToId] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkers = async () => {
        try {
            const response = await axios.get('http://10.0.2.2:3000/api/users/workers', {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            setWorkers(response.data);
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось загрузить исполнителей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleCreate = async () => {
        if (!title || !assignedToId || !dueDate) {
            Alert.alert('Ошибка', 'Заполните все поля');
            return;
        }

        try {
            await axios.post(
                'http://10.0.2.2:3000/api/tasks',
                {
                    title,
                    description,
                    dueDate,
                    assignedToId,
                    projectId: project.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            Alert.alert('Успех', 'Задача создана');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось создать задачу');
        }
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Название:</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} />

            <Text style={styles.label}>Описание:</Text>
            <TextInput value={description} onChangeText={setDescription} style={styles.input} multiline />

            <Text style={styles.label}>Срок сдачи (ГГГГ-ММ-ДД):</Text>
            <TextInput value={dueDate} onChangeText={setDueDate} style={styles.input} placeholder="2025-06-10" />

            <Text style={styles.label}>Исполнитель:</Text>
            <Picker
                selectedValue={assignedToId}
                onValueChange={(itemValue) => setAssignedToId(itemValue)}
                style={styles.input}
            >
                <Picker.Item label="Выберите исполнителя" value={null} />
                {workers.map((w) => (
                    <Picker.Item key={w.id} label={w.name} value={w.id} />
                ))}
            </Picker>

            <Button title="Создать задачу" onPress={handleCreate} />
        </View>
    );
};

export default AssignTaskScreen;

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    label: {
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 6,
        padding: 8,
        backgroundColor: '#fff',
    },
});
