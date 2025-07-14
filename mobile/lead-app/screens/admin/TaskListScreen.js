import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

// Функция для выбора цвета бейджа по статусу
const getStatusColor = (status) => {
    switch (status) {
        case 'Новая': return '#34C759'; // зелёный
        case 'Принят к исполнению': return '#FF9500'; // оранжевый
        case 'Выполнен, требует проверки': return '#b03fe5'; // красный
        case 'Завершена': return '#007AFF'; // синий
        default: return '#8E8E93'; // серый
    }
};

const TaskListScreen = ({ onLogout }) => {
    const navigation = useNavigation();
    const route = useRoute();
    const project = route.params?.project;

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back" size={24} />
                </TouchableOpacity>
            ),
            headerTitle: 'Задачи',
            headerTitleAlign: 'center',
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Выйти</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        const init = async () => {
            const stored = await AsyncStorage.getItem('user');
            const parsed = stored ? JSON.parse(stored) : null;
            setUser(parsed);
            if (parsed) fetchTasks(parsed.token);
        };
        init();
    }, []);

    useEffect(() => {
        if (!user) return;
        const unsub = navigation.addListener('focus', () => fetchTasks(user.token));
        return unsub;
    }, [navigation, user]);

    const fetchTasks = async (token) => {
        setLoading(true);
        try {
            const url = project
                ? `http://10.0.2.2:3000/api/tasks/all?projectId=${project.id}`
                : `http://10.0.2.2:3000/api/tasks/my`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (user) fetchTasks(user.token);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        onLogout();
    };

    const renderItem = ({ item }) => {
        const executor = item.assignedTo;
        const badgeColor = getStatusColor(item.status);
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('TaskDetailScreen', { task: item })}>
                <View style={styles.cardContent}>
                    <View style={styles.info}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.date}>Создано: {new Date(item.createdAt).toLocaleDateString()}</Text>
                        {executor && <Text style={styles.executorLabel}>Исполнитель: {executor.name}</Text>}
                        <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                    </View>
                    {executor && <Image source={{ uri: executor.avatarUrl }} style={styles.avatar} />}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <View style={styles.container}>
            {tasks.length === 0 ? (
                <View style={styles.empty}>
                    <Icon name="ios-list-outline" size={120} color="#C7C7CC" />
                    <Text style={styles.emptyTitle}>У вас пока нет задач</Text>
                    <Text style={styles.emptySubtitle}>Нажмите +, чтобы создать первую задачу</Text>
                </View>
            ) : (
                <FlatList data={tasks} keyExtractor={item => item.id.toString()} renderItem={renderItem} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            )}
            <TouchableOpacity style={styles.fab} activeOpacity={0.7} onPress={() => navigation.navigate('AssignTask', { project })}>
                <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    backButton: { paddingHorizontal: 16 },
    logoutButton: { paddingHorizontal: 16 },
    logoutText: { color: '#007AFF', fontSize: 15 },
    card: { backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 6, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    date: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
    executorLabel: { fontSize: 13, color: '#3C3C43', marginTop: 4 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
    statusText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
    avatar: { width: 32, height: 32, borderRadius: 16, marginLeft: 12 },
    fab: { position: 'absolute', right: 24, bottom: 100, backgroundColor: '#3250e7', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 17, color: '#1C1C1E', marginTop: 16 },
    emptySubtitle: { fontSize: 15, color: '#8E8E93', marginTop: 8 },
    list: { paddingVertical: 16 }
});

export default TaskListScreen;
