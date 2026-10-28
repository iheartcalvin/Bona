import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookOpen, Target, Users, Trophy, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Bona Main Screens ───────────────────────────────────────
import SubjectsScreen from '../screens/SubjectsScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ClassroomScreen from '../screens/ClassroomScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import SubjectDetailScreen from '../screens/SubjectDetailScreen';
import AITutorScreen from '../screens/AITutorScreen';
import BookReaderScreen from '../screens/BookReaderScreen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import SpacesScreen from '../screens/SpacesScreen';
import { useAppRole } from '../context/AppRoleContext';

// ─── Learn Stack (Learn Tab → Lesson → etc.) ─────────────────
const LearnStack = createNativeStackNavigator();
const LearnNavigator = () => (
  <LearnStack.Navigator screenOptions={{ headerShown: false }}>
    <LearnStack.Screen name="Subjects" component={SubjectsScreen} />
    <LearnStack.Screen name="LessonDetail" component={LessonDetailScreen} />
    <LearnStack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
    <LearnStack.Screen name="AITutor" component={AITutorScreen} />
    <LearnStack.Screen name="BookReader" component={BookReaderScreen} />
  </LearnStack.Navigator>
);

const TeacherStack = createNativeStackNavigator();
const TeacherNavigator = () => (
  <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
    <TeacherStack.Screen name="TeacherStudio" component={TeacherDashboardScreen} />
    <TeacherStack.Screen name="TeachingSpaces" component={SpacesScreen} />
  </TeacherStack.Navigator>
);

// ─── Tab Navigator ───────────────────────────────────────────
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { colors } = useTheme();
  const { isTeacher } = useAppRole();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          height: 68,
          paddingBottom: 12,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Learn"
        component={LearnNavigator}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          tabBarLabel: 'Practice',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Classroom"
        component={ClassroomScreen}
        options={{
          tabBarLabel: 'Classroom',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} />,
        }}
      />
      {isTeacher && <Tab.Screen name="Teach" component={TeacherNavigator} options={{ tabBarLabel: 'Teach', tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} /> }} />}
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
