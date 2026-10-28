import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { X, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, SPACING } from '../theme/colors';
import { UserService } from '../services/userService';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const UserListModal = ({ visible, onClose, type, uid, onUserSelect }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            if (uid && visible) {
                setLoading(true);
                try {
                    let data = [];
                    if (type === 'followers') {
                        data = await UserService.getUserFollowers(uid);
                    } else if (type === 'following') {
                        data = await UserService.getUserFollowing(uid);
                    }
                    setUsers(data);
                } catch (error) {
                    console.error("Error fetching user list:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (visible) {
            fetchUsers();
        } else {
            setUsers([]);
        }
    }, [uid, visible, type]);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.userCard} onPress={() => onUserSelect(item.uid)}>
            <Image
                source={{ uri: item.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100' }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName || item.username || 'Unknown User'}</Text>
                <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient colors={gradients.background} style={styles.gradientContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={users}
                                renderItem={renderItem}
                                keyExtractor={item => item.uid}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <View style={styles.center}>
                                        <Text style={styles.emptyText}>No users found.</Text>
                                    </View>
                                }
                            />
                        )}
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};



const createStyles = (colors) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    container: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    gradientContainer: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    title: { color: colors.text, fontSize: 20, fontWeight: '800', textTransform: 'capitalize' },
    closeBtn: { padding: 8 },
    listContent: { padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: colors.textSecondary },

    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    userInfo: { flex: 1 },
    userName: { color: colors.text, fontSize: 16, fontWeight: '700' },
    userHandle: { color: colors.textSecondary, fontSize: 12 }
});

export default UserListModal;
