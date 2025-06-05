import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Picker,
    ScrollView,
} from 'react-native';
import axios from 'axios';

const AssignTaskScreen = ({ user, navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [userRes, projectRes] = await Promise.all([
                axios.get('http://10.0.2.2:3000/users', {
                    headers: { Authorization: `Bearer ${user.token}` },
                }),
                axios.get('http://10.0.2.2:3000/projects', {
                    headers: { Authorization: `Bearer ${user.token}` },
                }),
            ]);
            setUsers(userRes.data);
            setProjects(projectRes.data);
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!title || !description || !selectedUser || !selectedProject) {
            return Alert.alert('Ошибка', 'Заполните все поля');
        }

        try {
            await axios.post(
                'http://10.0.2.2:3000/tasks',
                {
                    title,
                    description,
                    assignedTo: selectedUser,
                    projectId: selectedProject,
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );
            Alert.alert('Успех', 'Задача создана');
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Ошибка', 'Не удалось создать задачу');
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Название задачи</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Введите название"
            />

            <Text style={styles.label}>Описание</Text>
            <TextInput
                style={[styles.input, { height: 80 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Введите описание"
                multiline
            />

            <Text style={styles.label}>Проект</Text>
            <Picker
                selectedValue={selectedProject}
                onValueChange={(value) => setSelectedProject(value)}
            >
                <Picker.Item label="Выберите проект" value="" />
                {projects.map((proj) => (
                    <Picker.Item key={proj.id} label={proj.title} value={proj.id} />
                ))}
            </Picker>

            <Text style={styles.label}>Назначить на</Text>
            <Picker
                selectedValue={selectedUser}
                onValueChange={(value) => setSelectedUser(value)}
            >
                <Picker.Item label="Выберите пользователя" value="" />
                {users.map((u) => (
                    <Picker.Item key={u.id} label={u.name} value={u.id} />
                ))}
            </Picker>

            <View style={{ marginTop: 20 }}>
                <Button title="Создать задачу" onPress={handleAssign} />
            </View>
        </ScrollView>
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
