import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectListScreen from '../screens/admin/ProjectListScreen';
import CreateProjectScreen from '../screens/admin/CreateProjectScreen';
import TaskListScreen from '../screens/admin/TaskListScreen';
import AssignTaskScreen from '../screens/admin/AssignTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen'; // ✅ добавляем
import EditProjectScreen from '../screens/admin/EditProjectScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack({ user }) {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ProjectList" options={{ title: 'Проекты' }}>
                {(props) => <ProjectListScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="CreateProject" options={{ title: 'Создать проект' }}>
                {(props) => <CreateProjectScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="TaskList" options={{ title: 'Задачи проекта' }}>
                {(props) => <TaskListScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="AssignTask" options={{ title: 'Назначить задачу' }}>
                {(props) => <AssignTaskScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="TaskDetailScreen" options={{ title: 'Детали задачи' }}>
                {(props) => <TaskDetailScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="EditProject" options={{ title: 'Редактировать проект' }}>
                {(props) => <EditProjectScreen {...props} user={user} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
