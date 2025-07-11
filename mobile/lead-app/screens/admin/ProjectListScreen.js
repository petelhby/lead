// screens/admin/ProjectListScreen.js

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectListScreen({ navigation, user, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskCounts, setTaskCounts] = useState({}); // для количества задач

    const fetchProjects = async () => {
        try {
            console.log('USER TOKEN:', user?.token);
            const response = await axios.get(
                'http://10.0.2.2:3000/api/projects',
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            console.log('Projects loaded:', JSON.stringify(response.data, null, 2));
            setProjects(response.data);

            // загрузка количества задач по каждому проекту
            const counts = {};
            for (let project of response.data) {
                try {
                    const res = await axios.get(
                        `http://10.0.2.2:3000/api/tasks/count?projectId=${project.id}`,
                        { headers: { Authorization: `Bearer ${user.token}` } }
                    );
                    counts[project.id] = res.data.count || 0;
                } catch {
                    counts[project.id] = 0;
                }
            }
            setTaskCounts(counts);

        } catch (err) {
            console.error('Ошибка при загрузке проектов:', err);
            Alert.alert('Ошибка', 'Не удалось загрузить проекты: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Удалить проект',
            'Вы уверены, что хотите удалить этот проект?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(
                                `http://10.0.2.2:3000/api/projects/${id}`,
                                { headers: { Authorization: `Bearer ${user.token}` } }
                            );
                            fetchProjects();
                        } catch (err) {
                            console.error('Ошибка при удалении проекта:', err);
                            Alert.alert('Ошибка', 'Не удалось удалить проект');
                        }
                    },
                },
            ]
        );
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            onLogout && onLogout();
        } catch (err) {
            console.error('Ошибка при выходе:', err);
            Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable onPress={handleLogout} style={{ paddingHorizontal: 16 }}>
                    <Text style={{ color: '#007AFF', fontSize: 16 }}>Выйти</Text>
                </Pressable>
            ),
            headerTitle: 'Проекты',
        });
    }, [navigation]);

    useEffect(() => {
        fetchProjects();
        const unsubscribe = navigation.addListener('focus', fetchProjects);
        return unsubscribe;
    }, [navigation]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'IN_PROGRESS':
                return { backgroundColor: '#E0E7FF', color: '#1D4ED8' };
            case 'PAUSED':
                return { backgroundColor: '#FEF9C3', color: '#92400E' };
            case 'CLOSED':
                return { backgroundColor: '#DCFCE7', color: '#166534' };
            case 'PAID':
                return { backgroundColor: '#BBF7D0', color: '#15803D' };
            default:
                return { backgroundColor: '#E5E7EB', color: '#374151' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const taskCount = taskCounts[item.id] || 0;

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('TaskList', { project: item, user })}
                        style={{ flex: 1 }}
                    >
                        <Text style={styles.projectName}>{item.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.actions}>
                        <Pressable
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditProject', { project: item, user })}
                        >
                            <Ionicons name="create-outline" size={20} color="#007AFF" />
                        </Pressable>
                        <Pressable
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#fff" />
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.projectDate}>
                    Создано: {new Date(item.createdAt).toLocaleDateString()}
                </Text>

                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={{ color: statusStyle.color, fontSize: 13 }}>
                            {item.status === 'IN_PROGRESS' ? 'В работе' :
                                item.status === 'PAUSED' ? 'На паузе' :
                                    item.status === 'CLOSED' ? 'Закрыт' :
                                        item.status === 'PAID' ? 'Оплачен' :
                                            item.status}
                        </Text>
                    </View>
                    <View style={styles.taskCountCircle}>
                        <Text style={styles.taskCountText}>{taskCount}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={projects}
                keyExtractor={(item) => item.id?.toString() || item._id?.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshing={loading}
                onRefresh={fetchProjects}
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateProject', { user })}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    projectName: {
        fontSize: 17,
        fontWeight: '500',
        color: '#333',
    },
    projectDate: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statusBadge: {
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    taskCountCircle: {
        backgroundColor: '#5d218f', // фиолетовый кружок
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    taskCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 8,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        padding: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        backgroundColor: '#3250e7',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ccc',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
});
