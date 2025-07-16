import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

/* -------------------- helpers -------------------- */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export default function CreateProjectScreen({ route, navigation }) {
    const { user } = route.params;

    /* ------------------- state ---------------------- */
    const today = new Date();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());      // 0‑11
    const [day, setDay] = useState(today.getDate());

    const years = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const dueDateIso = () => new Date(year, month, day).toISOString();

    /* ---------------- header ------------------------ */
    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitleVisible: false,
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
                    <Text style={{ color: '#2962FF', fontSize: 14, marginRight: 6 }} numberOfLines={1}>{user.name}</Text>
                    <Ionicons name="exit-outline" size={24} color="#2962FF" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} />
                </View>
            ),
        });
    }, [navigation]);

    /* ---------------- submit ------------------------ */
    const handleCreate = async () => {
        if (!title.trim() || !budget) {
            return Alert.alert('Ошибка', 'Заполните все обязательные поля');
        }
        try {
            await axios.post(`${BASE_URL}/api/projects`, {
                name: title.trim(),
                description: description.trim(),
                budget: Number(budget),
                deadline: dueDateIso(),
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            Alert.alert('Успех', 'Проект создан');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Ошибка', err.response?.data?.message || 'Не удалось создать проект');
        }
    };

    /* ---------------- UI --------------------------- */
    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
                {/* Название */}
                <Text style={styles.label}>Название проекта:</Text>
                <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Введите название" />

                {/* Описание */}
                <Text style={styles.label}>Описание:</Text>
                <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline placeholder="Опишите проект" />

                {/* Бюджет */}
                <Text style={styles.label}>Бюджет:</Text>
                <TextInput value={budget} onChangeText={setBudget} style={styles.input} keyboardType="numeric" placeholder="0" />

                {/* Срок сдачи */}
                <Text style={styles.label}>Срок сдачи:</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={styles.pickerWrapSmall}>
                        <Picker selectedValue={year} onValueChange={setYear} style={styles.picker}>
                            {years.map(y => <Picker.Item key={y} label={String(y)} value={y} />)}
                        </Picker>
                    </View>
                    <View style={styles.pickerWrapSmall}>
                        <Picker selectedValue={month} onValueChange={setMonth} style={styles.picker}>
                            {MONTHS_RU.map((m, idx) => <Picker.Item key={idx} label={m} value={idx} />)}
                        </Picker>
                    </View>
                    <View style={styles.pickerWrapSmall}>
                        <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
                            {days.map(d => <Picker.Item key={d} label={String(d)} value={d} />)}
                        </Picker>
                    </View>
                </View>

                <Button title="Создать проект" onPress={handleCreate} color="#2962FF" />
            </View>
        </ScrollView>
    );
}

/* ---------------- styles -------------------------- */
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
    label: { fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
    },
    pickerWrapSmall: {
        flex: 1,
        minWidth: 90,      // чтобы текст не обрезался «…»
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FFF',
        marginHorizontal: 2,
    },
    picker: { width: '100%' },
});
