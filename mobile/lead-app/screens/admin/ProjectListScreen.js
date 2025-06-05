import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';

export default function ProjectListScreen({ navigation, user }) {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get('http://10.0.2.2:3000/api/projects', {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                setProjects(res.data);
            } catch (err) {
                console.error('Ошибка при загрузке проектов:', err.message);
            }
        };

        fetchProjects();
    }, []);

    return (
        <View style={{ padding: 20 }}>
            <Button title="Создать проект" onPress={() => navigation.navigate('CreateProject', { user })} />

            <FlatList
                data={projects}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{ padding: 10, borderBottomWidth: 1 }}
                        onPress={() => navigation.navigate('TaskList', { project: item, user })}
                    >
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                        <Text>{item.status}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
