import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert,
    Image, ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function TaskDetailScreen({ route, navigation, user }) {
    const { task } = route.params;
    const [entries, setEntries] = useState([]);
    const [report, setReport] = useState('');
    const [photos, setPhotos] = useState([]);
    const [status, setStatus] = useState(task.status);
    const [loading, setLoading] = useState(false);

    const fetchEntries = async () => {
        try {
            const res = await axios.get(`http://10.0.2.2:3000/api/tasks/${task.id}/entries`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setEntries(res.data);
        } catch (err) {
            console.error('Ошибка загрузки записей:', err);
            Alert.alert('Ошибка', 'Не удалось загрузить записи');
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const pickImages = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                multiple: true,
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setPhotos(result.assets || []);
            }
        } catch (err) {
            console.error('Ошибка выбора фото:', err);
            Alert.alert('Ошибка', 'Не удалось выбрать фото');
        }
    };

    const submitEntry = async () => {
        if (!report) return Alert.alert('Ошибка', 'Введите текст отчёта');

        const formData = new FormData();
        formData.append('report', report);
        formData.append('status', status);

        photos.forEach((photo, index) => {
            formData.append('photo', {
                uri: photo.uri,
                name: photo.name || `photo_${index}.jpg`,
                type: photo.mimeType || 'image/jpeg',
            });
        });

        try {
            setLoading(true);
            await axios.post(
                `http://10.0.2.2:3000/api/tasks/${task.id}/entries`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );
            setReport('');
            setPhotos([]);
            fetchEntries();
            Alert.alert('Успех', 'Запись добавлена');
        } catch (err) {
            console.error('Ошибка отправки записи:', err);
            Alert.alert('Ошибка', 'Не удалось отправить запись');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.label}>Описание: {task.description || '—'}</Text>
            <Text style={styles.label}>Срок: {task.dueDate?.slice(0, 10)}</Text>
            <Text style={styles.label}>Статус: {task.status}</Text>
            <Text style={styles.label}>Исполнитель: {task.assignedTo?.name || 'Не назначен'}</Text>

            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>Записи:</Text>
            {entries.map((entry, idx) => (
                <View key={idx} style={styles.entryBlock}>
                    <Text style={styles.entryMeta}>
                        {entry.author.name} — {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                    <Text style={styles.entryText}>{entry.report}</Text>
                    {entry.photos.map((url, i) => (
                        <Image
                            key={i}
                            source={{ uri: `http://10.0.2.2:3000/${url}` }}
                            style={styles.image}
                        />
                    ))}
                </View>
            ))}

            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>Добавить запись</Text>
            <TextInput
                style={styles.input}
                value={report}
                onChangeText={setReport}
                placeholder="Опишите, что сделано"
                multiline
            />

            <Text style={styles.label}>Статус задачи:</Text>
            <Picker selectedValue={status} onValueChange={setStatus}>
                <Picker.Item label="Принят к исполнению" value="Принят к исполнению" />
                <Picker.Item label="Выполнен, требует проверки" value="Выполнен, требует проверки" />
                <Picker.Item label="Закрыта" value="Закрыта" />
            </Picker>

            <Button title="Выбрать фото" onPress={pickImages} />
            <View style={styles.imagePreview}>
                {photos.map((photo, idx) => (
                    <Image key={idx} source={{ uri: photo.uri }} style={styles.image} />
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <Button title="Отправить запись" onPress={submitEntry} />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    label: { marginBottom: 4 },
    separator: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 6,
        marginBottom: 12,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 10,
        marginTop: 6,
        borderRadius: 6,
    },
    imagePreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 12,
    },
    entryBlock: {
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    entryMeta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    entryText: {
        fontSize: 14,
        marginBottom: 4,
    },
});
