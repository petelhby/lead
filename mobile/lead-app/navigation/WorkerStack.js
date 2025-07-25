// navigation/WorkerStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TaskListScreen from '../screens/admin/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

const Stack = createNativeStackNavigator();

export default function WorkerStack({ user, onLogout }) {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="TaskList"
                options={{ title: 'Мои задачи' }}
            >
                {props => (
                    <TaskListScreen
                        {...props}
                        user={user}
                        onLogout={onLogout}
                    />
                )}
            </Stack.Screen>

            <Stack.Screen
                name="TaskDetailScreen"
                options={{ title: 'Детали задачи' }}
            >
                {props => (
                    <TaskDetailScreen
                        {...props}
                        user={user}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
