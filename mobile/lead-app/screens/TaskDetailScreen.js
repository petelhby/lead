import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
    Image,
    FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* -------------------- helpers -------------------- */
const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000');

const STATUSES_ADMIN = [
    { label: 'Новая', value: 'Новая' },
    { label: 'Принят к исполнению', value: 'Принят к исполнению' },
    { label: 'Выполнен, требует проверки', value: 'Выполнен, требует проверки' },
    { label: 'Закрыта', value: 'Закрыта' },
];
const STATUSES_WORKER = STATUSES_ADMIN.filter(s => s.value !== 'Закрыта');

/* -------------------- component ------------------ */
export default function TaskDetailsScreen({ route, navigation }) {
    const { task: taskFromParams, user: userParam } = route.params || {};
    const taskId = taskFromParams?.id;

    const [token, setToken] = useState(null);
    const [user, setUser] = useState(userParam || null);
    const [task, setTask] = useState(taskFromParams || null);
    const [entries, setEntries] = useState([]);
    const [text, setText] = useState('');
    const [status, setStatus] = useState(taskFromParams?.status || 'Новая');
    const [photoUri, setPhotoUri] = useState(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    /* header */
    useEffect(() => navigation.setOptions({ headerBackTitleVisible: false }), [navigation]);

    /* token + user */
    useEffect(() => {
        (async () => {
            let t = route.params?.token;
            let u = userParam;
            if (!t) {
                const s = await AsyncStorage.getItem('user');
                if (s) {
                    try { const parsed = JSON.parse(s); t = parsed.token; u ||= parsed; } catch { }
                }
                if (!t) t = await AsyncStorage.getItem('token');
            }
            if (!t) {
                Alert.alert('Сессия истекла', 'Войдите снова', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') },
                ]);
                return;
            }
            setToken(t);
            if (u) setUser(u);
        })();
    }, []);

    const isWorker = user?.role === 'WORKER';
    const AVAILABLE_STATUSES = isWorker ? STATUSES_WORKER : STATUSES_ADMIN;

    /* fetch entries */
    useEffect(() => {
        if (!token || !taskId) return;
        (async () => {
            try {
                const { data } = await axios.get(
                    `${BASE_URL}/api/tasks/${taskId}/entries`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                setEntries(data);
            } catch (err) {
                console.warn('fetchEntries', err.response?.status);
            } finally {
                setLoading(false);
            }
        })();
    }, [token, taskId]);

    /* choose photo */
    const handleChoosePhoto = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            quality: 0.7,
        });
        if (!res.canceled) setPhotoUri(res.assets[0].uri);
    };

    /* send entry */
    const handleSend = async () => {
        if (!text.trim()) return Alert.alert('Ошибка', 'Введите запись');
        if (!token || !taskId) return;
        setSending(true);

        try {
            const fd = new FormData();
            fd.append('report', text.trim());
            fd.append('status', status);
            if (photoUri)
                fd.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' });

            const { data: newEntry } = await axios.patch(
                `${BASE_URL}/api/tasks/${taskId}/report`,
                fd,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            setEntries(prev => [newEntry, ...prev]);
            setTask(prev => ({ ...prev, status }));
            setText('');
            setPhotoUri(null);
        } catch (err) {
            console.error('sendEntry', err.message, err.response?.status);
            Alert.alert('Ошибка', err.response?.data?.message || err.message);
        } finally {
            setSending(false);
        }
    };

    const renderEntry = ({ item }) => (
        <View style={styles.entryCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold' }}>
                    {item.author?.name || '—'}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            {item.report ? <Text style={{ marginTop: 4 }}>{item.report}</Text> : null}
            {item.photos?.length ? (
                <ScrollView horizontal style={{ marginTop: 6 }}>
                    {item.photos.map((p, idx) => (
                        <Image
                            key={idx}
                            source={{ uri: `${BASE_URL}/${p}` }}
                            style={styles.entryImg}
                        />
                    ))}
                </ScrollView>
            ) : null}
        </View>
    );

    if (!task)
        return (
            <Text style={{ marginTop: 32, textAlign: 'center' }}>
                Задача не найдена
            </Text>
        );
    if (loading)
        return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;

    if (isWorker && task.status === 'Закрыта') {
        return (
            <Text style={{ marginTop: 32, textAlign: 'center' }}>
                Задача закрыта
            </Text>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled">
            {/* card с инфо о задаче */}
            <View style={styles.card}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.info}>Описание: {task.description || '—'}</Text>
                <Text style={styles.info}>Срок: {task.dueDate?.slice(0, 10)}</Text>
                <Text style={styles.info}>Статус: {task.status}</Text>
                <Text style={styles.info}>
                    Исполнитель: {task.assignedTo?.name}
                </Text>
            </View>

            {/* лента записей */}
            <FlatList
                data={entries}
                keyExtractor={e => String(e.id)}
                renderItem={renderEntry}
                ListHeaderComponent={<Text style={styles.section}>Записи</Text>}
                contentContainerStyle={{ paddingBottom: 16 }}
            />

            {/* форма новой записи */}
            {!isWorker || task.status !== 'Закрыта' ? (
                <View style={[styles.card, { marginTop: 8 }]}>
                    <Text style={styles.section}>Добавить запись</Text>
                    <TextInput
                        style={[styles.input, { height: 90 }]}
                        multiline
                        placeholder="Что сделано?"
                        value={text}
                        onChangeText={setText}
                    />

                    <Text style={styles.section}>Статус задачи</Text>
                    <View style={styles.pickerWrapFull}>
                        <Picker
                            selectedValue={status}
                            onValueChange={setStatus}
                            style={styles.picker}>
                            {AVAILABLE_STATUSES.map(s => (
                                <Picker.Item key={s.value} label={s.label} value={s.value} />
                            ))}
                        </Picker>
                    </View>

                    {photoUri && (
                        <Image
                            source={{ uri: photoUri }}
                            style={{ height: 140, borderRadius: 8, marginTop: 8 }}
                        />
                    )}

                    <Button title="Выбрать фото" onPress={handleChoosePhoto} color="#2962FF" />
                    <View style={{ height: 8 }} />
                    <Button
                        title={sending ? 'Отправка…' : 'Отправить запись'}
                        onPress={handleSend}
                        color="#2962FF"
                        disabled={sending}
                    />
                </View>
            ) : null}
        </ScrollView>
    );
}

/* styles */
const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#F6F7FB' },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    info: { fontSize: 14, marginBottom: 2 },
    section: { fontWeight: 'bold', marginTop: 16, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFF',
    },
    pickerWrapFull: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    picker: { width: '100%' },
    entryCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 10,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
    },
    entryImg: { width: 80, height: 80, borderRadius: 6, marginRight: 4 },
});
