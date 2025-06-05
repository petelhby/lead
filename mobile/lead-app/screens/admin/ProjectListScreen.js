import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Button,
    Alert,
} from 'react-native';
import axios from 'axios';

export default function ProjectListScreen({ navigation, user }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://10.0.2.2:3000/api/projects', {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            setProjects(response.data);
        } catch (err) {
            console.error('Ошибка при загрузке проектов:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
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
                            await axios.delete(`http://10.0.2.2:3000/api/projects/${id}`, {
                                headers: { Authorization: `Bearer ${user.token}` },
                            });
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

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchProjects);
        return unsubscribe;
    }, [navigation]);

    const renderItem = ({ item }) => (
        <View style={styles.projectItem}>
            <TouchableOpacity
                style={styles.projectContent}
                onPress={() => navigation.navigate('TaskList', { project: item, user })}
            >
                <Text style={styles.projectName}>{item.name}</Text>
            </TouchableOpacity>
            <View style={styles.editButton}>
                <Button
                    title="Ред."
                    onPress={() => navigation.navigate('EditProject', { project: item, user })}
                />
            </View>
            <View style={styles.deleteButton}>
                <Button
                    title="🗑"
                    color="#cc0000"
                    onPress={() => handleDelete(item.id)}
                />
            </View>
        </View>
    );

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={projects}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
            <View style={styles.createButton}>
                <Button
                    title="Создать проект"
                    onPress={() => navigation.navigate('CreateProject', { user })}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        padding: 16,
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    projectContent: {
        flex: 1,
    },
    projectName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        marginLeft: 12,
    },
    deleteButton: {
        marginLeft: 8,
    },
    createButton: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
});
