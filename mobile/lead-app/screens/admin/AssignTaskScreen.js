import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Экран «Назначить задачу»
 * — дата: 3 drop‑down‑поля (Год → Месяц → День)
 * — токен ищем в трёх местах: route.params.user?.token →
 *   AsyncStorage.getItem('token') →
 *   JSON.parse(AsyncStorage.getItem('user'))?.token
 */

const MONTHS_RU = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];

const getTodayParts = () => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

const YEARS_FORWARD = 5;

const AssignTaskScreen = ({ route, navigation }) => {
    const { project } = route.params;

    // --- TOKEN MANAGEMENT ----------------------------------------------------
    const initialToken = route.params?.user?.token || null;
    const [token, setToken] = useState(initialToken);
    const [tokenChecked, setTokenChecked] = useState(!!initialToken);

    useEffect(() => {
        const resolveToken = async () => {
            if (token) return setTokenChecked(true);
            try {
                // 1) plain token
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);
                    return setTokenChecked(true);
                }
                // 2) token внутри user JSON
                const storedUserJson = await AsyncStorage.getItem('user');
                const storedUser = storedUserJson ? JSON.parse(storedUserJson) : null;
                if (storedUser?.token) {
                    setToken(storedUser.token);
                }
            } catch (err) {
                console.warn('AsyncStorage error', err.message);
            } finally {
                setTokenChecked(true);
            }
        };
        if (!tokenChecked) resolveToken();
    }, [token, tokenChecked]);

    // Если токен не найден
    useEffect(() => {
        if (tokenChecked && !token) {
            Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова', [
                { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
            ]);
        }
    }, [tokenChecked, token, navigation]);

    // --- FORM STATE ---------------------------------------------------------
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const today = getTodayParts();
    const [year, setYear] = useState(today.year);
    const [month, setMonth] = useState(today.month);
    const [day, setDay] = useState(today.day);
    const [workers, setWorkers] = useState([]);
    const [assignedToId, setAssignedToId] = useState(null);
    const [loading, setLoading] = useState(false);

    const buildDateString = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // --- API --------------------------------------------------------------
    const fetchWorkers = async (authToken) => {
        if (!authToken) return;
        setLoading(true);
        try {
            const { data } = await axios.get('http://10.0.2.2:3000/api/users/workers', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setWorkers(data);
        } catch (err) {
            console.error('fetchWorkers', err?.response?.status, err.message);
            if (err?.response?.status === 401) {
                Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова', [
                    { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
                ]);
            } else {
                Alert.alert('Ошибка', 'Не удалось загрузить исполнителей');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tokenChecked && token) fetchWorkers(token);
    }, [tokenChecked, token]);

    // --- HANDLERS -----------------------------------------------------------
    const handleCreate = async () => {
        const dueDate = buildDateString(year, month, day);
        if (!title.trim() || !assignedToId) {
            Alert.alert('Ошибка', 'Заполните все обязательные поля');
            return;
        }
        try {
            await axios.post(
                'http://10.0.2.2:3000/api/tasks',
                { title: title.trim(), description: description.trim(), dueDate, assignedToId, projectId: project.id },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            Alert.alert('Успех', 'Задача создана', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err) {
            console.error('createTask', err?.response?.status, err.message);
            Alert.alert('Ошибка', 'Не удалось создать задачу');
        }
    };

    // --- RENDER -------------------------------------------------------------
    if (!tokenChecked || loading) {
        return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
    }

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={styles.label}>Название</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Введите название" />

            {/* Description */}
            <Text style={styles.label}>Описание</Text>
            <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { height: 96 }]}
                multiline
                placeholder="Опишите задачу"
            />

            {/* Due date */}
            <Text style={styles.label}>Срок сдачи</Text>
            <View style={styles.dateRow}>
                {/* Year */}
                <View style={styles.pickerWrapper}>
                    <Picker selectedValue={year} onValueChange={setYear} style={styles.picker}>
                        {Array.from({ length: YEARS_FORWARD + 1 }, (_, i) => today.year + i).map((y) => (
                            <Picker.Item key={y} label={`${y}`} value={y} />
                        ))}
                    </Picker>
                </View>
                {/* Month */}
                <View style={styles.pickerWrapper}>
                    <Picker selectedValue={month} onValueChange={setMonth} style={styles.picker}>
                        {MONTHS_RU.map((m, idx) => (
                            <Picker.Item key={m} label={m} value={idx + 1} />
                        ))}
                    </Picker>
                </View>
                {/* Day */}
                <View style={styles.pickerWrapper}>
                    <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <Picker.Item key={d} label={`${d}`} value={d} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Executor */}
            <Text style={styles.label}>Исполнитель</Text>
            <View style={styles.pickerWrapperFull}>
                <Picker selectedValue={assignedToId} onValueChange={setAssignedToId} style={styles.picker}>
                    <Picker.Item label="Выберите исполнителя" value={null} />
                    {workers.map((w) => (
                        <Picker.Item key={w.id} label={w.name} value={w.id} />
                    ))}
                </Picker>
            </View>

            {/* Submit */}
            <View style={{ marginTop: 24 }}>
                <Button title="Создать задачу" onPress={handleCreate} color="#2962FF" disabled={!workers.length} />
            </View>
        </ScrollView>
    );
};

export default AssignTaskScreen;

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#FFF' },
    label: { fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
    },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
    pickerWrapper: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FFF',
        marginRight: 6,
    },
    pickerWrapperFull: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#FFF' },
    picker: { width: '100%' },
});