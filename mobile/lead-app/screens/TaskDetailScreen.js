import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Image,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../utils/api';

const TaskDetailScreen = ({ route, navigation }) => {
    const { task, user } = route.params;
    const [report, setReport] = useState(task.report || '');
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const isWorker = user.role === 'WORKER';

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0]);
        }
    };

    const submitReport = async () => {
        if (!report) return Alert.alert('Ошибка', 'Введите текст отчёта');

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('report', report);

            if (photo) {
                formData.append('photo', {
                    uri: photo.uri,
                    name: 'report.jpg',
                    type: 'image/jpeg',
                });
            }

            await axios.patch(
                `${API_BASE_URL}/tasks/${task.id}/report`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            Alert.alert('Успех', 'Отчёт отправлен');
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Ошибка', 'Не удалось отправить отчёт');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Название</Text>
            <Text style={styles.value}>{task.title}</Text>

            <Text style={styles.label}>Описание</Text>
            <Text style={styles.value}>{task.description}</Text>

            <Text style={styles.label}>Дедлайн</Text>
            <Text style={styles.value}>{new Date(task.dueDate).toLocaleDateString()}</Text>

            <Text style={styles.label}>Проект</Text>
            <Text style={styles.value}>{task.project?.title || '—'}</Text>

            <Text style={styles.label}>Назначено</Text>
            <Text style={styles.value}>{task.assignedTo?.name || '—'}</Text>

            <Text style={styles.label}>Отчёт</Text>

            {isWorker ? (
                <TextInput
                    style={styles.input}
                    placeholder="Введите отчёт"
                    value={report}
                    onChangeText={setReport}
                    multiline
                />
            ) : (
                <Text style={styles.value}>{task.report || '—'}</Text>
            )}

            <Text style={styles.label}>Фото</Text>
            {task.photoUrl && !photo && (
                <Image source={{ uri: task.photoUrl }} style={styles.image} />
            )}

            {photo && (
                <Image source={{ uri: photo.uri }} style={styles.image} />
            )}

            {isWorker && (
                <>
                    <Button title="Выбрать фото" onPress={pickImage} />
                    <View style={{ marginTop: 10 }}>
                        <Button
                            title={submitting ? 'Отправка...' : 'Отправить отчёт'}
                            onPress={submitReport}
                            disabled={submitting}
                        />
                    </View>
                </>
            )}
        </ScrollView>
    );
};

export default TaskDetailScreen;

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    label: {
        fontWeight: 'bold',
        marginTop: 12,
    },
    value: {
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginTop: 4,
        marginBottom: 12,
        borderRadius: 6,
        minHeight: 60,
    },
    image: {
        width: '100%',
        height: 200,
        marginVertical: 10,
    },
});
