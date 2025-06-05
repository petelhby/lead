import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export default function TaskDetailScreen({ route }) {
    const { task } = route.params || {};

    if (!task) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ Задача не найдена</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Название:</Text>
            <Text style={styles.value}>{task.title}</Text>

            <Text style={styles.label}>Описание:</Text>
            <Text style={styles.value}>{task.description || '—'}</Text>

            <Text style={styles.label}>Статус:</Text>
            <Text style={styles.value}>{task.status}</Text>

            <Text style={styles.label}>Срок выполнения:</Text>
            <Text style={styles.value}>{task.dueDate?.slice(0, 10) || '—'}</Text>

            <Text style={styles.label}>Исполнитель:</Text>
            <Text style={styles.value}>{task.assignedTo?.name || 'Не назначен'}</Text>

            {task.report && (
                <>
                    <Text style={styles.label}>Отчёт:</Text>
                    <Text style={styles.value}>{task.report}</Text>
                </>
            )}

            {task.photoUrl && (
                <>
                    <Text style={styles.label}>Фотоотчёт:</Text>
                    <Image
                        source={{ uri: `http://10.0.2.2:3000/${task.photoUrl}` }}
                        style={styles.image}
                    />
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    label: {
        fontWeight: 'bold',
        marginTop: 12,
    },
    value: {
        fontSize: 16,
        marginTop: 4,
    },
    image: {
        height: 200,
        width: '100%',
        marginTop: 12,
        borderRadius: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
});
