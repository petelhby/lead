import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Button,
    StyleSheet,
} from 'react-native';
import axios from 'axios';

export default function TaskListScreen({ route, navigation, user }) {
    const project = route?.params?.project;
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        if (!user) return;

        try {
            let response;

            if (project) {
                response = await axios.get(
                    `http://10.0.2.2:3000/api/tasks/all?projectId=${project.id}`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` },
                    }
                );
            } else {
                response = await axios.get(`http://10.0.2.2:3000/api/tasks/my`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
            }

            setTasks(response.data);
        } catch (err) {
            console.error('Ошибка при загрузке задач:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchTasks);
        return unsubscribe;
    }, [navigation, project, user]);

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Нет данных пользователя</Text>
            </View>
        );
    }

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.taskItem}
            onPress={() => navigation.navigate('TaskDetailScreen', { task: item, user })}
        >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskStatus}>{item.status}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
            />
            {project && (
                <View style={styles.buttonContainer}>
                    <Button
                        title="Назначить задачу"
                        onPress={() => navigation.navigate('AssignTask', { project, user })}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    taskItem: {
        padding: 12,
        backgroundColor: '#f0f0f0',
        marginBottom: 12,
        borderRadius: 8,
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    taskStatus: {
        color: '#777',
        marginTop: 4,
    },
    buttonContainer: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
});
