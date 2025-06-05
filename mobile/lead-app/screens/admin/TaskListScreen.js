import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import axios from 'axios';

const TaskListScreen = ({ user, navigation }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = async () => {
        try {
            const url =
                user.role === 'ADMIN'
                    ? 'http://10.0.2.2:3000/tasks/all'
                    : 'http://10.0.2.2:3000/tasks/my';

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            setTasks(response.data);
        } catch (err) {
            console.error('Ошибка при получении задач:', err);
            setError('Не удалось загрузить задачи');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.taskItem}
            onPress={() =>
                navigation.navigate('TaskDetailScreen', { task: item, user })
            }
        >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskStatus}>
                Назначено: {item.assignedTo?.name || '—'}
            </Text>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
    if (error) return <Text style={styles.error}>{error}</Text>;
    if (tasks.length === 0)
        return <Text style={styles.empty}>Задачи не найдены</Text>;

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

export default TaskListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        padding: 16,
    },
    taskItem: {
        backgroundColor: '#f1f1f1',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    taskStatus: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 32,
    },
    empty: {
        textAlign: 'center',
        marginTop: 32,
        color: '#777',
    },
});
