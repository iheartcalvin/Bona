import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { X, Sparkles, Clock, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GRADIENTS, SPACING } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import { AIService } from '../services/aiService';

const AddPrayerModal = ({ visible, onClose, onSave, initialData }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Wisdom');
    const [time, setTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    React.useEffect(() => {
        if (visible) {
            if (initialData) {
                setTitle(initialData.title || '');
                setCategory(initialData.category || 'Wisdom');
                // Could also pre-fill time if editing, but for "scheduling saved", current time is fine
            } else {
                setTitle('');
                setCategory('Wisdom');
                setTime(new Date());
            }
        }
    }, [visible, initialData]);

    const categories = ['Wisdom', 'Healing', 'Gratitude', 'Strength', 'Peace', 'Guidance'];

    const handleGenerateTitle = async () => {
        setLoading(true);
        try {
            // Simple prompt for a title
            // AIService usually returns a full prayer. We might need a generic method or just ask for a short topic.
            // For now, let's keep it simple or assume we want a prayer TOPIC generator.
            // Since we don't have a specific "generateTitle" method, let's simulate or repurpose generic if available.
            // Or just generate a prayer and extract a title?
            // Let's just generate a 'Topic' based on category for now to be safe with existing unknown API structure.
            // actually, let's just use the category + random word for now to avoid breaking if API is strict.
            // Or better, let's generate a prayer text but use the first line as Title? 
            // Reuse generatePrayer
            const text = await AIService.generatePrayer(category);
            // Heuristic: take first 5-6 words
            const suggestedTitle = text.split(' ').slice(0, 5).join(' ') + '...';
            setTitle(suggestedTitle.replace(/"/g, ''));
        } catch (error) {
            console.log(error);
            Alert.alert("AI Error", "Could not generate title.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter a prayer title.");
            return;
        }

        // Format time to HH:mm AM/PM for consistency with existing data structure
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        onSave({
            title,
            category,
            time: timeStr
        });

        // Reset form
        setTitle('');
        setCategory('Wisdom');
        onClose();
    };

    const handleTimeChange = (event, selectedDate) => {
        setShowTimePicker(false);
        if (selectedDate) {
            setTime(selectedDate);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Schedule Prayer</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Title Input with AI Gen */}
                        <Text style={styles.label}>Prayer Title</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Morning Peace"
                                placeholderTextColor={colors.textSecondary + '80'}
                                value={title}
                                onChangeText={setTitle}
                            />
                            <TouchableOpacity
                                style={styles.aiBtn}
                                onPress={handleGenerateTitle}
                                disabled={loading}
                            >
                                <LinearGradient colors={gradients.primary} style={styles.aiBtnGradient}>
                                    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Sparkles size={18} color="#FFF" />}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Category Selection */}
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryRow}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catChip, category === cat && styles.catChipActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Time Picker */}
                        <Text style={styles.label}>Time</Text>
                        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(true)}>
                            <Clock size={20} color={colors.primary} style={{ marginRight: 10 }} />
                            <Text style={styles.timeText}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>

                        {showTimePicker && (
                            <DateTimePicker
                                value={time}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={handleTimeChange}
                            />
                        )}

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <LinearGradient colors={gradients.primary} style={styles.saveBtnGradient}>
                                <CheckCircle2 size={20} color={colors.text} style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnText}>Save to Schedule</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};



const createStyles = (colors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end'
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 40,
        height: '70%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700'
    },
    content: {
        padding: 24
    },
    label: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 10
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    aiBtn: {
        width: 54,
        borderRadius: 12,
        overflow: 'hidden'
    },
    aiBtnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24
    },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    catChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    catText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500'
    },
    catTextActive: {
        color: '#FFF',
        fontWeight: '700'
    },
    timeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    timeText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600'
    },
    saveBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4
    },
    saveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700'
    }
});

export default AddPrayerModal;
