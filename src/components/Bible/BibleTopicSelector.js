import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../../theme/colors';
import { BIBLE_STRUCTURE as bibleData } from '../../data/bibleStructure';

const BibleTopicSelector = ({ visible, onClose, onSelect }) => {
    const [step, setStep] = useState('book'); // 'book' or 'chapter'
    const [selectedBook, setSelectedBook] = useState(null);
    const [filterTestament, setFilterTestament] = useState('All');

    const reset = () => {
        setStep('book');
        setSelectedBook(null);
        setFilterTestament('All');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleBookSelect = (book) => {
        setSelectedBook(book);
        setStep('chapter');
    };

    const handleChapterSelect = (chapter) => {
        const result = `${selectedBook.name} ${chapter}`;
        onSelect(result);
        handleClose();
    };

    const renderBookSelector = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <X color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Select Book</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filterRow}>
                {['All', 'Old', 'New'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterChip,
                            filterTestament === type && styles.filterChipActive
                        ]}
                        onPress={() => setFilterTestament(type)}
                    >
                        <Text style={[
                            styles.filterText,
                            filterTestament === type && { color: 'white', fontWeight: '700' }
                        ]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                key="book-list"
                data={bibleData.filter(b => filterTestament === 'All' || b.testament === filterTestament)}
                keyExtractor={(item) => item.name}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.bookItem}
                        onPress={() => handleBookSelect(item)}
                    >
                        <Text style={styles.bookName}>{item.name}</Text>
                        <ChevronRight color={COLORS.textSecondary} size={16} />
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const renderChapterSelector = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('book')} style={styles.closeBtn}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>{selectedBook?.name}</Text>
                <TouchableOpacity onPress={handleClose}>
                    <X color={COLORS.text} size={24} />
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Select Chapter</Text>

            <FlatList
                key="chapter-list"
                data={Array.from({ length: selectedBook?.chapters || 0 }, (_, i) => i + 1)}
                keyExtractor={(item) => item.toString()}
                contentContainerStyle={styles.chapterGrid}
                numColumns={5}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.chapterItem}
                        onPress={() => handleChapterSelect(item)}
                    >
                        <Text style={styles.chapterText}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleClose}
        >
            <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    {step === 'book' ? renderBookSelector() : renderChapterSelector()}
                </SafeAreaView>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    title: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700'
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 10
    },
    closeBtn: {
        padding: 4
    },
    filterRow: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: 10
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    filterText: {
        color: COLORS.textSecondary,
        fontSize: 14
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40
    },
    bookItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        margin: 6,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    bookName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600'
    },
    chapterGrid: {
        padding: SPACING.lg
    },
    chapterItem: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    chapterText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default BibleTopicSelector;
