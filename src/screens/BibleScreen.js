import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, Image, ActivityIndicator, PanResponder, Animated, Dimensions, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Volume2, BookOpen, Share2, Users, Search, ChevronRight, X, Minus, Plus, ArrowRight, ArrowLeft, RotateCw, Mic, Pause, Trash2, Home, ChevronUp, ChevronDown, Film, Captions, Languages } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SPACING } from '../theme/colors';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import ViewShot, { captureRef } from 'react-native-view-shot';
import SpaceStudy from '../components/Bible/SpaceStudy';
import NotificationBell from '../components/NotificationBell';
import { BIBLE_STRUCTURE as bibleData } from '../data/bibleStructure';
import { BibleService } from '../services/bibleService';
import { UserService } from '../services/userService';
import { SpaceService } from '../services/SpaceService';
import { FilmModeService } from '../services/FilmModeService';

import SpeechService from '../services/SpeechService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const BibleScreen = ({ navigation, route }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { user } = useAuth();
    // User Bible Data
    const [readingHistory, setReadingHistory] = useState([]);
    const [progressPercent, setProgressPercent] = useState(0);
    const [completedChaptersCount, setCompletedChaptersCount] = useState(0);

    // ... rest of state
    const [showFullReader, setShowFullReader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('reading');
    const [fontSize, setFontSize] = useState(18);
    const [volume, setVolume] = useState(0.7);
    const [barWidth, setBarWidth] = useState(0); // For volume slider calculation

    const [autoNext, setAutoNext] = useState(true);

    // Real Bible Data State
    const [currentBook, setCurrentBook] = useState(bibleData[0]); // Default: Genesis
    const [currentChapter, setCurrentChapter] = useState(1);
    const [chapterData, setChapterData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [showCompletion, setShowCompletion] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);

    // AI Voice Reader State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const channelId = route.params?.channelId;
    const filmWebViewRef = useRef(null);
    const [isFilmMode, setIsFilmMode] = useState(false);
    const [filmLoading, setFilmLoading] = useState(false);
    const [filmData, setFilmData] = useState(null);
    const [filmError, setFilmError] = useState(null);
    const [selectedQuality, setSelectedQuality] = useState('720p');
    const [isFilmLandscape, setIsFilmLandscape] = useState(false);

    // Verse Selection & Sharing State
    const [selectedVerses, setSelectedVerses] = useState([]); // Array of { book, chapter, verse, text }
    const [highlightedVerses, setHighlightedVerses] = useState({}); // Map: "Genesis-1-1": "#FFD700"

    // Interactive Navigation State
    const [showBookSelector, setShowBookSelector] = useState(false);
    const [showChapterSelector, setShowChapterSelector] = useState(false);
    const [selectorTestament, setSelectorTestament] = useState('All');
    const [showShareModal, setShowShareModal] = useState(false);
    const viewShotRef = React.useRef();
    const [userHighlights, setUserHighlights] = useState([]);
    const [selectedTestament, setSelectedTestament] = useState('All');
    const [draggingItem, setDraggingItem] = useState(null);
    const [isControlsMinimized, setIsControlsMinimized] = useState(false);
    const touchStart = useRef({ x: 0, y: 0, time: 0 });

    // Fix Android Modal Scroll Freeze
    const [isModalReady, setIsModalReady] = useState(false);

    useEffect(() => {
        if (showFullReader) {
            setIsModalReady(false);
            const timer = setTimeout(() => setIsModalReady(true), 150);
            return () => clearTimeout(timer);
        }
    }, [showFullReader]);

    // Filtered books based on search and testament
    const filteredBooks = bibleData.filter(book => {
        const matchesSearch = book.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTestament = selectedTestament === 'All' || book.testament === selectedTestament;
        return matchesSearch && matchesTestament;
    });

    const pan = useRef(new Animated.ValueXY()).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
                pan.setValue({ x: 0, y: 0 });
                scaleAnim.setValue(1);
                opacityAnim.setValue(1);
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();

                // Check if dropped in bin (Bottom 150px)
                if (gestureState.moveY > SCREEN_HEIGHT - 150) {
                    // Warp Effect: Shrink, Fade, and Move towards center bottom if needed
                    Animated.parallel([
                        Animated.timing(scaleAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: false
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: false
                        })
                    ]).start(() => {
                        // Action after animation
                        setDraggingItem(prev => {
                            if (prev && user) {
                                UserService.deleteHighlight(user.uid, prev.id);
                                Vibration.vibrate(100);
                            }
                            return null;
                        });
                        pan.setValue({ x: 0, y: 0 });
                        scaleAnim.setValue(1);
                        opacityAnim.setValue(1);
                    });
                } else {
                    // Return to start
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false
                    }).start(() => {
                        setDraggingItem(null);
                        pan.setValue({ x: 0, y: 0 });
                    });
                }
            }
        })
    ).current;

    const toggleVerseSelection = (verse) => {
        const verseId = `${currentBook.name}-${currentChapter}-${verse.verse}`;
        // Create full verse object
        const verseObj = { ...verse, book: currentBook.name, chapter: currentChapter, id: verseId };

        if (selectedVerses.some(v => v.id === verseId)) {
            setSelectedVerses(prev => prev.filter(v => v.id !== verseId));
        } else {
            // Sort by verse number if multiple selected
            setSelectedVerses(prev => [...prev, verseObj].sort((a, b) => parseInt(a.verse) - parseInt(b.verse)));
        }
    };

    const isVerseSelected = (verse) => {
        const verseId = `${currentBook.name}-${currentChapter}-${verse.verse}`;
        return selectedVerses.some(v => v.id === verseId);
    };

    const getVerseHighlight = (verse) => {
        const verseId = `${currentBook.name}-${currentChapter}-${verse.verse}`;
        return highlightedVerses[verseId];
    };

    const handleCopy = async () => {
        const text = selectedVerses.map(v => `${v.text} (${v.book} ${v.chapter}:${v.verse})`).join('\n\n');
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', 'Verses copied to clipboard');
        setSelectedVerses([]);
    };

    const handleHighlight = (color) => {
        const newHighlights = { ...highlightedVerses };
        selectedVerses.forEach(v => {
            if (color === 'none') {
                delete newHighlights[v.id];
            } else {
                newHighlights[v.id] = color;
            }
            // Save to DB
            if (user) {
                // If 'none', we could delete the doc, but for now let's just save null/delete if we had a dedicated delete method
                // For simplicity, we overwrite. If 'none', we might want to actually deleteDoc in UserService.
                if (color === 'none') {
                    // Ideally we should delete, but we'll implement a removeHighlight in future or just save as null
                    UserService.saveHighlight(user.uid, { ...v, color: null });
                } else {
                    UserService.saveHighlight(user.uid, {
                        id: v.id,
                        book: v.book,
                        chapter: v.chapter,
                        verse: v.verse,
                        text: v.text,
                        color: color
                    });
                }
            }
        });
        setHighlightedVerses(newHighlights);
        setSelectedVerses([]);
    };

    // Load Highlights (Map for Reader)
    useEffect(() => {
        if (user) {
            const unsub = UserService.subscribeToHighlights(user.uid, (data) => {
                setHighlightedVerses(data);
            });
            // Also fetch full list for dashboard
            const unsubList = UserService.subscribeToFullHighlights(user.uid, (data) => {
                setUserHighlights(data);
            });
            return () => {
                unsub();
                unsubList();
            };
        }
    }, [user]);

    const quizQuestions = [
        {
            id: 1,
            question: "What was Adam told that made him hide?",
            options: ["Run away", "Your now of sin", "You look so scared", "I can see you Adam"],
            correct: 1
        },
        {
            id: 2,
            question: "In the beginning, what did God create?",
            options: ["The ocean", "The heavens and earth", "The animals", "The sun"],
            correct: 1
        }
    ];


    useEffect(() => {
        fetchChapter();
    }, [currentBook, currentChapter]);

    useEffect(() => {
        loadVoices();
        return () => {
            SpeechService.stop();
        };
    }, []);

    const loadVoices = async () => {
        const available = await SpeechService.getAvailableVoices();
        setVoices(available);
        if (available.length > 0) {
            // SpeechService already sorts by quality, so just pick the first English voice
            const defaultVoice = available.find(v => v.language.startsWith('en')) || available[0];
            setSelectedVoice(defaultVoice);
        }
    };

    const qualityToYouTube = (quality) => {
        switch (quality) {
            case '360p':
                return 'small';
            case '480p':
                return 'medium';
            case '720p':
            default:
                return 'hd720';
        }
    };

    const getFilmPlayerHtml = (videoId, quality) => {
        const playbackQuality = qualityToYouTube(quality);
        return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <style>
    html, body, #player {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player;
    function post(type, payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
    }
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 1,
          cc_lang_pref: 'en'
        },
        events: {
          onReady: function(event) {
            event.target.setPlaybackQuality('${playbackQuality}');
            event.target.playVideo();
            post('ready', {
              duration: event.target.getDuration(),
              quality: event.target.getPlaybackQuality(),
              availableQualityLevels: event.target.getAvailableQualityLevels()
            });
          },
          onStateChange: function(event) {
            post('state', { state: event.data });
          },
          onPlaybackQualityChange: function(event) {
            post('quality', { quality: event.data });
          },
          onError: function(event) {
            post('error', { code: event.data });
          }
        }
      });
    }
    window.setFilmQuality = function(quality) {
      if (player && player.setPlaybackQuality) {
        player.setPlaybackQuality(quality);
        post('qualityRequested', { quality: quality });
      }
    };
  </script>
</body>
</html>`;
    };

    const handleEnterFilmMode = async () => {
        setIsFilmMode(true);
        setFilmLoading(true);
        setFilmError(null);
        setSelectedVerses([]);

        if (isSpeaking) {
            await SpeechService.stop();
            setIsSpeaking(false);
        }

        try {
            const film = await FilmModeService.getFilmForChapter(currentBook.name, currentChapter);
            setFilmData(film);
            setSelectedQuality(film.qualities?.includes(selectedQuality) ? selectedQuality : '720p');
        } catch (error) {
            console.error('Film mode load failed:', error);
            setFilmError('Could not load film data for this chapter.');
        } finally {
            setFilmLoading(false);
        }
    };

    const handleExitFilmMode = async () => {
        setIsFilmMode(false);
        setFilmError(null);
        if (isFilmLandscape) {
            try {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            } catch (error) {
                console.warn('Could not return to portrait:', error);
            }
            setIsFilmLandscape(false);
        }
    };

    const handleToggleFilmOrientation = async () => {
        try {
            if (isFilmLandscape) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                setIsFilmLandscape(false);
            } else {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                setIsFilmLandscape(true);
            }
        } catch (error) {
            console.warn('Manual rotation failed:', error);
            Alert.alert('Rotate unavailable', 'This device could not switch orientation right now.');
        }
    };

    const handleSelectFilmQuality = (quality) => {
        setSelectedQuality(quality);
        filmWebViewRef.current?.injectJavaScript(`
          if (window.setFilmQuality) {
            window.setFilmQuality('${qualityToYouTube(quality)}');
          }
          true;
        `);
    };

    useEffect(() => {
        return () => {
            ScreenOrientation.unlockAsync().catch(() => { });
        };
    }, []);

    const toggleSpeech = async () => {
        if (isSpeaking) {
            await SpeechService.pause();
            setIsSpeaking(false);
            if (isBroadcasting && channelId) {
                SpaceService.broadcastReading(channelId, {
                    isSpeaking: false,
                    book: currentBook.name,
                    chapter: currentChapter
                });
            }
        } else {
            setIsSpeaking(true);

            // Determine text to speak (Full chapter vs Start from Selection)
            let textToSpeak = chapterData?.text || '';

            // If verses are selected, start from the first selected verse
            if (selectedVerses.length > 0 && chapterData?.verses) {
                // Find the earliest verse selected (users might select out of order)
                const sortedSelected = [...selectedVerses].sort((a, b) => parseInt(a.verse) - parseInt(b.verse));
                const startVerseNum = sortedSelected[0].verse;

                // Find index in the full chapter data
                const startIndex = chapterData.verses.findIndex(v => v.verse == startVerseNum); // loose equality for string/number safety

                if (startIndex !== -1) {
                    // Create text from start verse to end of chapter
                    textToSpeak = chapterData.verses.slice(startIndex).map(v => v.text).join(' ');
                    console.log(`Starting reading from Verse ${startVerseNum}`);
                }
            }

            const speakingData = {
                isSpeaking: true,
                book: currentBook.name,
                chapter: currentChapter
            };

            if (SpeechService.isPaused) {
                await SpeechService.resume();
            } else {
                await SpeechService.speak(textToSpeak, {
                    voice: selectedVoice?.identifier,
                    rate: 0.9,
                    pitch: 1.0,
                    onDone: () => {
                        setIsSpeaking(false);
                        if (isBroadcasting && channelId) {
                            SpaceService.broadcastReading(channelId, { ...speakingData, isSpeaking: false });
                        }
                    },
                    onStopped: () => {
                        setIsSpeaking(false);
                        if (isBroadcasting && channelId) {
                            SpaceService.broadcastReading(channelId, { ...speakingData, isSpeaking: false });
                        }
                    },
                    onError: (e) => {
                        console.error("Speech Error", e);
                        setIsSpeaking(false);
                        if (isBroadcasting && channelId) {
                            SpaceService.broadcastReading(channelId, { ...speakingData, isSpeaking: false });
                        }
                    }
                });
            }

            if (isBroadcasting && channelId) {
                SpaceService.broadcastReading(channelId, speakingData);
            }
        }
    };

    const fetchChapter = async () => {
        setLoading(true);
        try {
            const data = await BibleService.getChapter(currentBook.name, currentChapter);
            setChapterData(data);

            // Save Progress to Firestore
            if (user) {
                await UserService.saveBibleProgress(user.uid, currentBook.name, currentChapter, "1");
            }

            // Sync if broadcasting
            if (isBroadcasting && channelId) {
                SpaceService.broadcastReading(channelId, {
                    isSpeaking,
                    book: currentBook.name,
                    chapter: currentChapter
                });
            }
        } catch (error) {
            console.error(error);
            setChapterData({ text: `Failed to load: ${error.message}`, verses: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleVolumeChange = (event) => {
        if (barWidth > 0) {
            const touchX = event.nativeEvent.locationX;
            const newVolume = Math.min(Math.max(touchX / barWidth, 0), 1);
            setVolume(newVolume);
            // Optionally update speech rate instantly if needed, but volume is just a state here for now
        }
    };

    // Calculate Total Chapters in Bible for Progress
    const TOTAL_CHAPTERS = 1189;

    useEffect(() => {
        if (!user) return;

        const unsubscribe = UserService.subscribeToUserProfile(user.uid, (data) => {
            if (data) {
                setReadingHistory(data.readingHistory || []);

                // Calculate Progress
                // Flatten the map: { "Genesis": [1,2], "Exodus": [1] } -> 3
                let count = 0;
                if (data.completedChapters) {
                    Object.values(data.completedChapters).forEach(chapters => {
                        count += chapters.length;
                    });
                }
                setCompletedChaptersCount(count);
                setProgressPercent(Math.min((count / TOTAL_CHAPTERS) * 100, 100));
            }
        });
        return () => unsubscribe();
    }, [user]);


    const mockVerses = [
        { id: 1, reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
        { id: 2, reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.' },
        { id: 3, reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
    ];

    const mockParticipants = [
        { id: '1', name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', isSpeaking: true },
        { id: '2', name: 'Sarah W.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', isSpeaking: false },
        { id: '3', name: 'Michael K.', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', isSpeaking: false },
        { id: '4', name: 'Faith G.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100', isSpeaking: false },
    ];
    const toggleMember = (member) => {
        setSelectedMembers(prev =>
            prev.find(m => m.id === member.id)
                ? prev.filter(m => m.id !== member.id)
                : [...prev, member]
        );
    };





    const handleTouchStart = (e) => {
        touchStart.current = {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
            time: new Date().getTime()
        };
    };

    const handleTouchEnd = (e) => {
        const touchEnd = {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
            time: new Date().getTime()
        };

        const dx = touchEnd.x - touchStart.current.x;
        const dy = touchEnd.y - touchStart.current.y;
        const dt = touchEnd.time - touchStart.current.time;

        if (Math.abs(dx) > 50 && Math.abs(dy) < 80 && dt < 500) {
            if (dx > 0) {
                // Swipe Right -> Previous
                if (currentChapter > 1) {
                    setCurrentChapter(prev => prev - 1);
                }
            } else {
                // Swipe Left -> Next
                if (currentChapter < currentBook.chapters) {
                    setCurrentChapter(prev => prev + 1);
                } else if (currentChapter >= currentBook.chapters) {
                    setShowCompletion(true);
                }
            }
        }
    };

    const renderHeader = () => (
        <LinearGradient colors={gradients.background} style={styles.header}>
            <View style={styles.headerTitleContainer}>
                <View>
                    <Text style={styles.headerSubtitle}>Discover the Word</Text>
                    <Text style={styles.headerTitle}>{viewMode === 'reading' ? 'Holy Bible' : 'Library'}</Text>
                </View>
                <View style={styles.headerActions}>
                    <View style={styles.iconButton}>
                        <NotificationBell color={colors.accent} />
                    </View>

                    <TouchableOpacity style={styles.iconButton} onPress={() => setViewMode(viewMode === 'reading' ? 'library' : 'reading')}>
                        {viewMode === 'library' ? (
                            <Home color={colors.accent} size={24} />
                        ) : (
                            <BookOpen color={colors.accent} size={24} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Spaces')}>
                        <Users color={colors.accent} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search books or verses..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        if (text && viewMode !== 'library') setViewMode('library');
                    }}
                />
            </View>

            {viewMode === 'library' && (
                <View style={styles.filterRow}>
                    {['All', 'Old', 'New'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                selectedTestament === type && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedTestament(type)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedTestament === type && { fontWeight: '700' }
                            ]}>
                                {type === 'All' ? 'All Books' : `${type} Testament`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </LinearGradient>
    );

    const renderLibrary = () => (
        <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.libraryList}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.bookItem}
                    onPress={() => {
                        setCurrentBook(item);
                        setCurrentChapter(1);
                        setViewMode('reading');
                        setShowFullReader(true);
                    }}
                >
                    <View style={styles.bookIconContainer}>
                        <View style={styles.bookDot} />
                    </View>
                    <Text style={styles.bookName}>{item.name}</Text>
                    <ChevronRight color={colors.textSecondary} size={20} />
                </TouchableOpacity>
            )}
        />
    );

    const renderFilmModeContent = () => {
        const qualities = filmData?.qualities || ['360p', '480p', '720p'];
        const thumbnail = filmData?.thumbnailUrl || (filmData?.videoId ? `https://img.youtube.com/vi/${filmData.videoId}/hqdefault.jpg` : null);

        return (
            <View style={styles.filmModeContainer}>
                <View style={styles.filmHeader}>
                    <TouchableOpacity style={styles.filmIconButton} onPress={handleExitFilmMode}>
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <View style={styles.filmTitleGroup}>
                        <Text style={styles.filmKicker}>Film Mode</Text>
                        <Text style={styles.filmTitle} numberOfLines={1}>{currentBook.name} {currentChapter}</Text>
                    </View>
                    <TouchableOpacity style={styles.filmIconButton} onPress={handleToggleFilmOrientation}>
                        <RotateCw color="white" size={22} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.filmPlayerShell, isFilmLandscape && styles.filmPlayerShellLandscape]}>
                    {thumbnail && filmLoading && (
                        <Image source={{ uri: thumbnail }} style={styles.filmThumbnail} blurRadius={4} />
                    )}

                    {filmLoading ? (
                        <View style={styles.filmLoadingOverlay}>
                            <ActivityIndicator color="white" size="large" />
                            <Text style={styles.filmLoadingText}>Loading chapter film...</Text>
                        </View>
                    ) : filmError ? (
                        <View style={styles.filmEmptyState}>
                            <Film color="white" size={42} />
                            <Text style={styles.filmEmptyTitle}>Film unavailable</Text>
                            <Text style={styles.filmEmptyText}>{filmError}</Text>
                        </View>
                    ) : filmData?.videoId ? (
                        <WebView
                            ref={filmWebViewRef}
                            key={`${filmData.videoId}-${currentBook.name}-${currentChapter}`}
                            style={styles.filmWebView}
                            source={{ html: getFilmPlayerHtml(filmData.videoId, selectedQuality), baseUrl: 'https://www.youtube.com' }}
                            javaScriptEnabled
                            domStorageEnabled
                            allowsInlineMediaPlayback
                            mediaPlaybackRequiresUserAction={false}
                            allowsFullscreenVideo
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.filmLoadingOverlay}>
                                    <ActivityIndicator color="white" size="large" />
                                </View>
                            )}
                            onMessage={(event) => {
                                try {
                                    const message = JSON.parse(event.nativeEvent.data);
                                    if (message.type === 'error') {
                                        setFilmError(`YouTube could not play this video. Error code: ${message.payload?.code || 'unknown'}`);
                                    }
                                } catch (error) {
                                    console.warn('Film player message parse failed:', error);
                                }
                            }}
                        />
                    ) : (
                        <View style={styles.filmEmptyState}>
                            <Film color="white" size={42} />
                            <Text style={styles.filmEmptyTitle}>No video configured</Text>
                            <Text style={styles.filmEmptyText}>Add a YouTube video ID for this chapter in Firestore.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.filmControlsPanel}>
                    <View style={styles.filmMetadataRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.filmVideoTitle} numberOfLines={2}>
                                {filmData?.title || `${currentBook.name} ${currentChapter} animated story`}
                            </Text>
                            <Text style={styles.filmVideoAuthor} numberOfLines={1}>
                                {filmData?.author ? `YouTube • ${filmData.author}` : 'YouTube powered video player'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.qualityRow}>
                        {qualities.map((quality) => (
                            <TouchableOpacity
                                key={quality}
                                style={[styles.qualityButton, selectedQuality === quality && styles.qualityButtonActive]}
                                onPress={() => handleSelectFilmQuality(quality)}
                            >
                                <Text style={[styles.qualityText, selectedQuality === quality && styles.qualityTextActive]}>
                                    {quality}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.filmDataGrid}>
                        <View style={styles.filmDataPill}>
                            <Languages color="#93C5FD" size={16} />
                            <Text style={styles.filmDataText}>{filmData?.language || 'English'}</Text>
                        </View>
                        <View style={styles.filmDataPill}>
                            <Captions color="#93C5FD" size={16} />
                            <Text style={styles.filmDataText}>{(filmData?.captions || ['English']).join(', ')}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.backToTextButton} onPress={handleExitFilmMode}>
                        <BookOpen color="white" size={18} />
                        <Text style={styles.backToTextText}>Back to Text Mode</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFullReader = () => (
        <Modal
            visible={showFullReader}
            animationType="slide"
            transparent={false}
            onRequestClose={() => {
                if (isFilmMode) {
                    handleExitFilmMode();
                } else {
                    setShowFullReader(false);
                }
            }}
        >

            <LinearGradient
                colors={gradients.background}
                style={styles.fullReaderContainer}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <SafeAreaView style={{ flex: 1 }} collapsable={false}>
                    {isFilmMode ? renderFilmModeContent() : (
                        <>
                    <View style={styles.fullReaderHeader}>
                        <TouchableOpacity onPress={() => {
                            handleExitFilmMode();
                            setShowFullReader(false);
                        }}>
                            <X color={colors.text} size={28} />
                        </TouchableOpacity>
                        <View style={styles.fullReaderTitleGroup}>
                            <TouchableOpacity onPress={() => setShowBookSelector(true)}>
                                <Text style={styles.fullReaderBook}>{currentBook.name}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowChapterSelector(true)}>
                                <Text style={styles.fullReaderChapter}>Chapter {currentChapter}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity>
                            <Share2 color={colors.text} size={24} />
                        </TouchableOpacity>
                    </View>

                    {isModalReady && (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.fullReaderContent}
                            removeClippedSubviews={false}
                            nestedScrollEnabled={true}
                        >
                            {loading ? (
                                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                            ) : (
                                <View style={{ paddingBottom: 100 }}>
                                    {chapterData?.verses && chapterData.verses.length > 0 ? (
                                        chapterData.verses.map((verse, index) => {
                                            const isSelected = isVerseSelected(verse);
                                            const highlightColor = getVerseHighlight(verse);
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[
                                                        styles.verseContainer,
                                                        isSelected && { backgroundColor: 'rgba(74, 144, 226, 0.2)' },
                                                        highlightColor && { backgroundColor: highlightColor + '40' } // 25% opacity
                                                    ]}
                                                    onPress={() => toggleVerseSelection(verse)}
                                                    onLongPress={() => toggleVerseSelection(verse)}
                                                    delayLongPress={200}
                                                >
                                                    <Text style={[styles.verseNumber, { fontSize: fontSize * 0.6 }]}>
                                                        {verse.verse}
                                                    </Text>
                                                    <Text style={[styles.fullReaderText, { fontSize: fontSize, lineHeight: fontSize * 1.6, flex: 1 }]}>
                                                        {verse.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <Text style={[styles.fullReaderText, { fontSize: fontSize }]}>
                                            {chapterData?.text || 'Loading...'}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {/* Verse Selection Toolbar */}
                    {selectedVerses.length > 0 && (
                        <View style={styles.selectionToolbar}>
                            <View style={styles.toolbarContent}>
                                {/* Color Actions */}
                                <View style={styles.colorActions}>
                                    <TouchableOpacity
                                        style={[styles.colorDot, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.textSecondary }]}
                                        onPress={() => handleHighlight('none')}
                                    >
                                        <View style={{ flex: 1, transform: [{ rotate: '45deg' }], width: 2, height: '100%', backgroundColor: colors.textSecondary, alignSelf: 'center' }} />
                                    </TouchableOpacity>
                                    {['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA'].map(color => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[styles.colorDot, { backgroundColor: color }]}
                                            onPress={() => handleHighlight(color)}
                                        />
                                    ))}
                                </View>

                                <View style={styles.verticalDivider} />

                                {/* Tool Actions */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity style={styles.iconActionBtn} onPress={handleCopy}>
                                        <View style={styles.iconActionBg}>
                                            <BookOpen color={colors.primary} size={16} />
                                        </View>
                                        <Text style={styles.iconActionLabel}>Copy</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.iconActionBtn} onPress={() => setShowShareModal(true)}>
                                        <View style={styles.iconActionBg}>
                                            <Share2 color={colors.primary} size={16} />
                                        </View>
                                        <Text style={styles.iconActionLabel}>Share</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.closeActionBtn} onPress={() => setSelectedVerses([])}>
                                        <X color={colors.textSecondary} size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={[styles.readerControls, isControlsMinimized && styles.readerControlsMinimized]}>

                        <TouchableOpacity
                            style={styles.minimizeToggleBtn}
                            onPress={() => setIsControlsMinimized(!isControlsMinimized)}
                        >
                            {isControlsMinimized ? (
                                <View style={styles.restoreControlsRow}>
                                    <View style={styles.restoreInfo}>
                                        <Text style={styles.restoreTitle}>{currentBook.name} {currentChapter}</Text>
                                        {isSpeaking && <View style={styles.speakingIndicator}><Text style={styles.speakingText}>Reading...</Text></View>}
                                    </View>
                                    <ChevronUp color={colors.textSecondary} size={24} />
                                </View>
                            ) : (
                                <ChevronDown color={colors.textSecondary} size={24} style={{ alignSelf: 'center', marginBottom: 10 }} />
                            )}
                        </TouchableOpacity>

                        {!isControlsMinimized && (
                            <>
                                {/* Zoom Control */}
                                <View style={styles.zoomControlRow}>
                                    <View style={styles.sliderContainer}>
                                        <TouchableOpacity onPress={() => setFontSize(Math.max(14, fontSize - 2))}>
                                            <Minus color={colors.textSecondary} size={16} />
                                        </TouchableOpacity>
                                        <View style={styles.sliderTrack}>
                                            <View style={[styles.sliderFill, { width: `${((fontSize - 14) / 16) * 100}%` }]} />
                                        </View>
                                        <TouchableOpacity onPress={() => setFontSize(Math.min(30, fontSize + 2))}>
                                            <Plus color={colors.textSecondary} size={16} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.zoomLabel}>{(fontSize)}px</Text>
                                </View>

                                {/* Main Transport */}
                                <View style={styles.transportControls}>
                                    <TouchableOpacity
                                        style={[styles.transportBtnSmall, currentChapter <= 1 && { opacity: 0.3 }]}
                                        disabled={currentChapter <= 1}
                                        onPress={() => {
                                            if (currentChapter > 1) {
                                                setCurrentChapter(prev => prev - 1);
                                            }
                                        }}
                                    >
                                        <ArrowLeft color={colors.textSecondary} size={24} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.playProgressContainer} onPress={toggleSpeech}>
                                        <LinearGradient colors={gradients.primary} style={styles.playButtonInner}>
                                            {isSpeaking ? (
                                                <Pause color="white" size={32} fill="white" />
                                            ) : (
                                                <Play color="white" size={32} fill="white" style={{ marginLeft: 4 }} />
                                            )}
                                        </LinearGradient>
                                        <View style={styles.progressRing} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.transportBtnSmall}
                                        onPress={() => {
                                            if (currentChapter >= currentBook.chapters) {
                                                setShowCompletion(true);
                                            } else {
                                                setCurrentChapter(prev => prev + 1);
                                            }
                                        }}
                                    >
                                        <ArrowRight color={colors.textSecondary} size={24} />
                                    </TouchableOpacity>
                                </View>

                                {/* Mode Toggles */}
                                <View style={styles.modeControls}>
                                    <TouchableOpacity
                                        style={styles.modeBtn}
                                        onPress={handleEnterFilmMode}
                                    >
                                        <Film color={colors.textSecondary} size={20} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modeBtn, showVoiceModal && styles.modeBtnActive]}
                                        onPress={() => setShowVoiceModal(true)}
                                    >
                                        <Mic color={showVoiceModal ? 'white' : colors.textSecondary} size={20} />
                                    </TouchableOpacity>

                                    {channelId && (
                                        <TouchableOpacity
                                            style={[styles.modeBtn, isBroadcasting && { backgroundColor: colors.accent }]}
                                            onPress={() => {
                                                const newState = !isBroadcasting;
                                                setIsBroadcasting(newState);
                                                if (newState) {
                                                    SpaceService.broadcastReading(channelId, {
                                                        isSpeaking,
                                                        book: currentBook.name,
                                                        chapter: currentChapter
                                                    });
                                                }
                                            }}
                                        >
                                            <Users color={isBroadcasting ? 'white' : colors.textSecondary} size={20} />
                                        </TouchableOpacity>
                                    )}
                                </View>


                            </>
                        )}
                    </View>

                    {showCompletion && (
                        <View style={styles.completionOverlay}>
                            <View style={[styles.completionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                                <Text style={[styles.completionCongrats, { color: colors.text }]}>Congratulations</Text>
                                <Text style={styles.completionSub}>You have completed your first Book in the bible!</Text>

                                <View style={[styles.completionDivider, { backgroundColor: colors.cardBorder }]}>
                                    <Text style={styles.endOfText}>The End of</Text>
                                    <Text style={[styles.bookFinishName, { color: colors.primary }]}>{currentBook.name}</Text>
                                </View>

                                <View style={styles.quizSection}>
                                    <Text style={[styles.testTheoryText, { color: colors.accent }]}>TEST YOU THEORY</Text>
                                    <Text style={styles.quizDesc}>To proceed to the next Chapter, complete the Quiz.</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.startQuizBtn}
                                    onPress={() => {
                                        setShowCompletion(false);
                                        setShowQuiz(true);
                                        setCurrentQuestion(0);
                                        setQuizScore(0);
                                        setQuizFinished(false);
                                        setSelectedOption(null);
                                    }}
                                >
                                    <Text style={styles.startQuizText}>Start Quiz</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.proceedBtn}
                                    onPress={() => {
                                        setShowCompletion(false);
                                        setCurrentChapter(prev => prev + 1);
                                        // Stay in Full Reader for smooth transition
                                    }}
                                >
                                    <Text style={[styles.proceedText, { color: colors.textSecondary }]}>Proceed without test</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                        </>
                    )}
                </SafeAreaView>
            </LinearGradient >

            <Modal visible={showQuiz} animationType="fade" transparent={false}>
                <View style={[styles.quizContainer, { backgroundColor: '#000' }]}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.quizHeader}>
                            <Text style={styles.quizHeaderTitle}>Quiz</Text>
                            <View style={styles.quizProgressBar}>
                                <View style={[styles.quizProgressFill, { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }]} />
                            </View>
                            {!quizFinished && (
                                <Text style={styles.quizScoreGoal}>Score between 7 - 10 to Proceed to the next chapter.</Text>
                            )}
                        </View>

                        {!quizFinished ? (
                            <View style={styles.quizContent}>
                                <Text style={styles.questionNum}>Qn. {quizQuestions[currentQuestion].question}</Text>
                                <View style={styles.optionsList}>
                                    {quizQuestions[currentQuestion].options.map((opt, index) => (
                                        <Text key={index} style={styles.optionText}>
                                            {String.fromCharCode(65 + index)}.   {opt}
                                        </Text>
                                    ))}
                                </View>

                                <View style={styles.selectionRow}>
                                    {['A', 'B', 'C', 'D'].map((letter, index) => (
                                        <TouchableOpacity
                                            key={letter}
                                            style={[styles.letterBox, selectedOption === index && { borderColor: '#4A90E2', backgroundColor: '#4A90E2' }]}
                                            onPress={() => setSelectedOption(index)}
                                        >
                                            <Text style={styles.letterText}>{letter}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.nextBtn, selectedOption === null && { opacity: 0.5 }]}
                                    disabled={selectedOption === null}
                                    onPress={() => {
                                        if (selectedOption === quizQuestions[currentQuestion].correct) {
                                            setQuizScore(prev => prev + 1);
                                        }

                                        if (currentQuestion < quizQuestions.length - 1) {
                                            setCurrentQuestion(prev => prev + 1);
                                            setSelectedOption(null);
                                        } else {
                                            setQuizFinished(true);
                                        }
                                    }}
                                >
                                    <Text style={styles.nextBtnText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.quizResultContent}>
                                <Text style={styles.resultCongrats}>Congratulations you're in to the next chapter.</Text>

                                <View style={styles.scoreCircle}>
                                    <Text style={styles.scoreBig}>{quizScore}</Text>
                                    <Text style={styles.scoreOutOf}>Out of {quizQuestions.length}</Text>
                                </View>

                                <View style={styles.correctionSection}>
                                    <View>
                                        <Text style={styles.correctionLabel}>Correction:</Text>
                                        <Text style={styles.correctionDetails}>Qn 1 and Qn 2</Text>
                                    </View>
                                    <TouchableOpacity>
                                        <Text style={styles.viewCorrections}>View Corrections</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.toNextChapterBtn}
                                    onPress={() => {
                                        setQuizFinished(false);
                                        setShowQuiz(false);
                                        setShowCompletion(false);
                                        setCurrentChapter(prev => prev + 1);
                                        // Stay in Full Reader for smooth transition
                                    }}
                                >
                                    <Text style={styles.toNextBtnText}>To Next Chapter</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backHomeBtn}
                                    onPress={() => {
                                        setShowQuiz(false);
                                        setShowFullReader(false);
                                    }}
                                >
                                    <Text style={styles.backHomeText}>Back to Home</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Voice Selection Modal */}
            <Modal visible={showVoiceModal} animationType="slide" transparent={true}>
                <View style={styles.voiceModalOverlay}>
                    <LinearGradient colors={[colors.surface, colors.background]} style={styles.voiceModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select AI Voice</Text>
                            <TouchableOpacity onPress={() => setShowVoiceModal(false)} style={{ padding: 8 }}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.voiceModalSubtitle}>Choose a voice for your reading companion</Text>

                        <FlatList
                            data={voices}
                            keyExtractor={(item) => item.identifier}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.voiceOption,
                                        selectedVoice?.identifier === item.identifier && styles.voiceOptionSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedVoice(item);
                                        // Optionally preview voice here
                                        SpeechService.speak("Hallelujah", { voice: item.identifier });
                                    }}
                                >
                                    <View style={styles.voiceInfo}>
                                        <Text style={[styles.voiceName, selectedVoice?.identifier === item.identifier && { color: colors.background }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.voiceLang, selectedVoice?.identifier === item.identifier && { color: 'rgba(0,0,0,0.6)' }]}>
                                            {item.language}
                                        </Text>
                                    </View>
                                    {selectedVoice?.identifier === item.identifier && (
                                        <Play size={16} color={colors.background} fill={colors.background} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                                    Loading voices...
                                </Text>
                            }
                        />

                        <TouchableOpacity
                            style={styles.saveVoiceBtn}
                            onPress={() => setShowVoiceModal(false)}
                        >
                            <Text style={styles.saveVoiceText}>Confirm Selection</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>

            {/* Share Card Modal */}
            <Modal visible={showShareModal} animationType="fade" transparent={false}>
                <LinearGradient colors={gradients.dark} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <SafeAreaView style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                        <View style={{ width: '100%', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setShowShareModal(false)}>
                                <X color="white" size={28} />
                            </TouchableOpacity>
                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Share Verse</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ViewShot
                                ref={viewShotRef}
                                options={{ format: "jpg", quality: 0.9 }}
                                style={{ margin: 20 }}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={{
                                        padding: 40,
                                        borderRadius: 20,
                                        width: 340,
                                        minHeight: 400,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center', fontFamily: 'serif' }}>
                                        {currentBook.name}
                                    </Text>
                                    <Text style={{ color: 'white', fontSize: 14, opacity: 0.8, marginBottom: 40, letterSpacing: 2 }}>
                                        CHAPTER {currentChapter}
                                    </Text>

                                    <View>
                                        {selectedVerses.map(v => (
                                            <View key={v.id} style={{ marginBottom: 16 }}>
                                                <Text style={{ color: 'white', fontSize: 18, lineHeight: 28, textAlign: 'center', fontStyle: 'italic' }}>
                                                    "{v.text}"
                                                </Text>
                                                <Text style={{ color: 'white', fontSize: 12, opacity: 0.6, textAlign: 'right', marginTop: 4 }}>
                                                    v.{v.verse}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, opacity: 0.9 }}>
                                        <Image
                                            source={require('../../assets/logo.png')}
                                            style={{ width: 80, height: 30, opacity: 0.7, resizeMode: 'contain', tintColor: 'white' }}
                                        />
                                    </View>
                                </LinearGradient>
                            </ViewShot>
                        </View>

                        <View style={{ padding: 30, width: '100%' }}>
                            <TouchableOpacity
                                style={{ backgroundColor: colors.primary, padding: 20, borderRadius: 30, alignItems: 'center', marginBottom: 20 }}
                                onPress={async () => {
                                    try {
                                        const uri = await captureRef(viewShotRef, {
                                            format: "jpg",
                                            quality: 0.8
                                        });
                                        await Sharing.shareAsync(uri);
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to share image");
                                    }
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Share Image</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

        </Modal >
    );

    const renderReading = () => {
        // Get last read item or default to Genesis 1
        const lastRead = readingHistory.length > 0 ? readingHistory[0] : null;
        const displayTitle = lastRead ? lastRead.title : 'Genesis 1:1';
        const displayText = lastRead ? 'Continue where you left off...' : 'In the beginning God created the heavens and the earth.';

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.verseCard}>
                    <LinearGradient
                        colors={['rgba(108, 99, 255, 0.1)', 'transparent']}
                        style={styles.verseCardGradient}
                    />
                    <Text style={styles.verseTitle}>{displayTitle}</Text>
                    <Text style={styles.verseText}>{displayText}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                if (lastRead) {
                                    const book = bibleData.find(b => b.name === lastRead.book);
                                    if (book) {
                                        setCurrentBook(book);
                                        setCurrentChapter(lastRead.chapter);
                                    }
                                } else {
                                    // Default to Genesis 1 if no history
                                    setCurrentBook(bibleData[0]);
                                    setCurrentChapter(1);
                                }
                                setViewMode('reading');
                                setShowFullReader(true);
                            }}
                        >
                            <Play color={colors.accent} size={20} />
                            <Text style={styles.actionText}>Read Me</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>Bible Progress</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
                        {completedChaptersCount} chapters read ({progressPercent.toFixed(1)}%)
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Continue Reading</Text>

                {readingHistory.length > 0 ? (
                    readingHistory.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.book}-${item.chapter}-${index}`}
                            style={styles.verseListItem}
                            onPress={() => {
                                // Find book object
                                const book = bibleData.find(b => b.name === item.book);
                                if (book) {
                                    setCurrentBook(book);
                                    setCurrentChapter(item.chapter);
                                    setViewMode('reading');
                                    setShowFullReader(true);
                                }
                            }}
                        >
                            <View style={styles.verseListHeader}>
                                <Text style={styles.verseListRef}>{item.title}</Text>
                                <Volume2 color={colors.textSecondary} size={16} />
                            </View>
                            <Text style={styles.verseListText} numberOfLines={1}>
                                Resume reading {item.book} Chapter {item.chapter}...
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={{ color: colors.textSecondary, fontStyle: 'italic', marginLeft: 20 }}>No reading history yet.</Text>
                )}

                {/* Highlights Section */}
                {userHighlights.length > 0 && (
                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.sectionTitle}>My Highlights</Text>
                        {Object.entries(userHighlights.reduce((acc, curr) => {
                            (acc[curr.color] = acc[curr.color] || []).push(curr);
                            return acc;
                        }, {})).map(([color, highlights]) => (
                            <View key={color} style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 20 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 }} />
                                    <Text style={{ color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', fontSize: 12 }}>
                                        {/* Simple color name mapping or just hex */}
                                        {color === '#FFD700' ? 'Gold' :
                                            color === '#FF6B6B' ? 'Red' :
                                                color === '#4ECDC4' ? 'Teal' :
                                                    color === '#A78BFA' ? 'Purple' : 'Custom'} Highlights
                                    </Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 10 }} />
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                                    {highlights.map((h, idx) => (
                                        <TouchableOpacity
                                            key={h.id}
                                            style={{
                                                width: 200,
                                                backgroundColor: colors.surface,
                                                padding: 16,
                                                borderRadius: 16,
                                                borderLeftWidth: 4,
                                                borderLeftColor: color,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.05)'
                                            }}
                                            onLongPress={() => {
                                                setDraggingItem(h);
                                                Vibration.vibrate(50);
                                            }}
                                            onPress={() => {
                                                const book = bibleData.find(b => b.name === h.book);
                                                if (book) {
                                                    setCurrentBook(book);
                                                    setCurrentChapter(h.chapter);
                                                    setViewMode('reading');
                                                    setShowFullReader(true);
                                                }
                                            }}
                                        >
                                            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                                                {h.book} {h.chapter}:{h.verse}
                                            </Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={3}>
                                                "{h.text}"
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {renderHeader()}

            {viewMode === 'reading' ? renderReading() : renderLibrary()}

            {renderFullReader()}

            {/* Drag and Drop Overlay for Deletion */}
            {draggingItem && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
                    <Animated.View
                        {...panResponder.panHandlers}
                        style={[
                            pan.getLayout(),
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: opacityAnim,
                                width: 200,
                                backgroundColor: colors.surface,
                                padding: 16,
                                borderRadius: 16,
                                borderLeftWidth: 4,
                                borderLeftColor: draggingItem.color,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                                elevation: 10
                            }
                        ]}
                    >
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                            {draggingItem.book} {draggingItem.chapter}:{draggingItem.verse}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={3}>
                            "{draggingItem.text}"
                        </Text>
                    </Animated.View>

                    {/* Trash Bin Zone */}
                    <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
                        <View style={{
                            width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 59, 48, 0.2)',
                            justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF3B30'
                        }}>
                            <Trash2 color="#FF3B30" size={32} />
                        </View>
                        <Text style={{ color: '#FF3B30', marginTop: 8, fontWeight: '700' }}>Drop to Delete</Text>
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.fab} onPress={toggleSpeech}>
                <LinearGradient colors={gradients.primary} style={styles.fabGradient}>
                    {isSpeaking ? (
                        <Pause color="white" size={32} fill="white" />
                    ) : (
                        <Play color="white" size={32} fill="white" />
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Book Selector Modal */}
            <Modal
                visible={showBookSelector}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowBookSelector(false)}
            >
                <LinearGradient colors={gradients.dark} style={styles.modalFullContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalFullScreenHeader}>
                            <TouchableOpacity onPress={() => setShowBookSelector(false)} style={styles.modalCloseBtn}>
                                <X color={colors.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select Book</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <View style={styles.selectorFilterRow}>
                            {['All', 'Old', 'New'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.selectorFilterChip,
                                        selectorTestament === type && styles.selectorFilterChipActive
                                    ]}
                                    onPress={() => setSelectorTestament(type)}
                                >
                                    <Text style={[
                                        styles.selectorFilterText,
                                        selectorTestament === type && { color: 'white', fontWeight: '700' }
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            data={bibleData.filter(b => selectorTestament === 'All' || b.testament === selectorTestament)}
                            keyExtractor={(item) => item.name}
                            contentContainerStyle={styles.selectorList}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.selectorBookItem, currentBook.name === item.name && styles.selectorActiveItem]}
                                    onPress={() => {
                                        setCurrentBook(item);
                                        setCurrentChapter(1);
                                        setShowBookSelector(false);
                                    }}
                                >
                                    <Text style={[styles.selectorBookName, currentBook.name === item.name && { color: colors.primary }]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

            {/* Chapter Selector Modal */}
            <Modal
                visible={showChapterSelector}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowChapterSelector(false)}
            >
                <View style={styles.chapterModalOverlay}>
                    <View style={styles.chapterModalContainer}>
                        <View style={styles.chapterModalHeader}>
                            <Text style={styles.chapterModalTitle}>{currentBook.name} Chapters</Text>
                            <TouchableOpacity onPress={() => setShowChapterSelector(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={Array.from({ length: currentBook.chapters }, (_, i) => i + 1)}
                            keyExtractor={(item) => item.toString()}
                            numColumns={5}
                            contentContainerStyle={styles.chaptersGrid}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.chapterGridItem, currentChapter === item && styles.chapterGridItemActive]}
                                    onPress={() => {
                                        setCurrentChapter(item);
                                        setShowChapterSelector(false);
                                    }}
                                >
                                    <Text style={[styles.chapterGridText, currentChapter === item && { color: 'white' }]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Voice Selector Modal */}
            <Modal
                visible={showVoiceModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowVoiceModal(false)}
            >
                <LinearGradient colors={gradients.dark} style={styles.modalFullContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalFullScreenHeader}>
                            <TouchableOpacity onPress={() => setShowVoiceModal(false)} style={styles.modalCloseBtn}>
                                <X color={colors.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select Voice</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <Text style={{ color: colors.textSecondary, padding: 20, textAlign: 'center' }}>
                            We've auto-selected the best quality voice for you, but feel free to choose another!
                        </Text>

                        <FlatList
                            data={voices}
                            keyExtractor={(item) => item.identifier}
                            contentContainerStyle={{ padding: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.voiceItem,
                                        selectedVoice?.identifier === item.identifier && styles.voiceItemActive
                                    ]}
                                    onPress={() => {
                                        setSelectedVoice(item);
                                        setShowVoiceModal(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[styles.voiceName, selectedVoice?.identifier === item.identifier && { color: colors.primary }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.voiceLang}>{item.language} {item.quality && `• ${item.quality}`}</Text>
                                    </View>
                                    {selectedVoice?.identifier === item.identifier && (
                                        <View style={styles.checkmark}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

        </SafeAreaView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: SPACING.lg, paddingBottom: SPACING.md },
    headerTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    headerSubtitle: { color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { color: colors.text, fontSize: 32, fontWeight: '800' },
    headerActions: { flexDirection: 'row', gap: SPACING.md },
    iconButton: { padding: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: SPACING.md,
        height: 50,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    searchIcon: { marginRight: SPACING.sm },
    searchInput: { flex: 1, color: colors.text, fontSize: 16 },

    filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
    chapterGridItemActive: { backgroundColor: colors.primary, borderWidth: 0 },
    chapterGridText: { color: colors.text, fontSize: 16, fontWeight: '600' },

    // Voice Selector Styles
    voiceItem: {
        padding: 16,
        backgroundColor: colors.surface,
        marginBottom: 10,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    voiceItemActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.1)'
    },
    voiceName: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
    voiceLang: { color: colors.textSecondary, fontSize: 12 },
    checkmark: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: colors.primary,
        justifyContent: 'center', alignItems: 'center'
    },

    scrollContent: { padding: SPACING.md, paddingBottom: 120 },
    libraryList: { padding: SPACING.md, paddingBottom: 120 },
    bookItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: colors.surface,
        borderRadius: 20,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    bookIconContainer: { marginRight: SPACING.md },
    bookDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.primary },
    bookName: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '600' },

    verseCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
    },
    verseCardGradient: { ...StyleSheet.absoluteFillObject },
    verseTitle: { color: colors.accent, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm },
    verseText: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '500' },
    actionRow: { flexDirection: 'row', marginTop: SPACING.lg, gap: SPACING.md },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        gap: SPACING.sm
    },
    actionText: { color: colors.accent, fontWeight: '600' },
    sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: SPACING.md },
    verseListItem: {
        backgroundColor: colors.surface,
        padding: SPACING.lg,
        borderRadius: 20,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    verseListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    verseListRef: { color: colors.secondary, fontWeight: '700' },
    verseListText: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
    fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 30, elevation: 8 },
    fabGradient: { padding: SPACING.md, borderRadius: 30, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },

    // Full Reader Styles
    fullReaderContainer: { flex: 1, backgroundColor: colors.background },
    fullReaderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg },
    fullReaderTitleGroup: { alignItems: 'center' },
    fullReaderBook: { color: colors.text, fontSize: 32, fontWeight: '800' },
    fullReaderChapter: { color: colors.textSecondary, fontSize: 16 },
    fullReaderContent: { padding: SPACING.xl },
    fullReaderText: { color: colors.text, lineHeight: 32, fontWeight: '400' },
    filmModeContainer: {
        flex: 1,
        backgroundColor: '#020617',
        paddingHorizontal: 14,
        paddingBottom: 16,
    },
    filmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 12,
    },
    filmIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filmTitleGroup: {
        flex: 1,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filmKicker: {
        color: '#93C5FD',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    filmTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    filmPlayerShell: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        position: 'relative',
    },
    filmPlayerShellLandscape: {
        flex: 1,
        aspectRatio: undefined,
        minHeight: 240,
    },
    filmWebView: {
        flex: 1,
        backgroundColor: '#000',
    },
    filmThumbnail: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        opacity: 0.45,
    },
    filmLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    filmLoadingText: {
        color: 'white',
        marginTop: 12,
        fontWeight: '700',
    },
    filmEmptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    filmEmptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 14,
        marginBottom: 8,
    },
    filmEmptyText: {
        color: '#CBD5E1',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    filmControlsPanel: {
        paddingTop: 16,
        gap: 14,
    },
    filmMetadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filmVideoTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },
    filmVideoAuthor: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 4,
        fontWeight: '600',
    },
    qualityRow: {
        flexDirection: 'row',
        gap: 10,
    },
    qualityButton: {
        minWidth: 72,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    qualityButtonActive: {
        backgroundColor: '#2563EB',
        borderColor: '#60A5FA',
    },
    qualityText: {
        color: '#CBD5E1',
        fontSize: 13,
        fontWeight: '800',
    },
    qualityTextActive: {
        color: 'white',
    },
    filmDataGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filmDataPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(147,197,253,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(147,197,253,0.18)',
    },
    filmDataText: {
        color: '#DBEAFE',
        fontSize: 12,
        fontWeight: '700',
    },
    backToTextButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    backToTextText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    readerControls: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        paddingBottom: 40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    readerControlsMinimized: {
        paddingTop: 10,
        paddingBottom: 30, // Reduced padding
    },
    minimizeToggleBtn: {
        paddingBottom: 5,
        width: '100%',
        alignItems: 'center', // Center the chevron
        marginBottom: 4
    },
    restoreControlsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    restoreInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    restoreTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    speakingIndicator: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    speakingText: { color: 'white', fontSize: 10, fontWeight: '700' },
    zoomControlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16
    },
    zoomLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        width: 40,
        textAlign: 'right'
    },
    transportControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40, // More space between Play and Arrow
        marginBottom: 24
    },
    transportBtnSmall: {
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24, // Rounder
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    modeControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 4
    },
    modeBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    modeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
    sliderTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
    sliderFill: { height: '100%', backgroundColor: colors.text, borderRadius: 2 },

    // Voice Modal Styles
    voiceModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    voiceModalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING.xl, height: '70%' },
    voiceModalSubtitle: { color: colors.textSecondary, marginBottom: SPACING.lg },
    voiceOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    voiceOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    voiceInfo: { flex: 1 },
    voiceName: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    voiceLang: { color: colors.textSecondary, fontSize: 12 },
    saveVoiceBtn: { marginTop: SPACING.lg, backgroundColor: colors.primary, padding: SPACING.lg, borderRadius: 16, alignItems: 'center' },
    saveVoiceText: { color: 'white', fontSize: 16, fontWeight: '800' },

    // Selector Styles
    modalFullContainer: { flex: 1 },
    modalFullScreenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 60,
        paddingBottom: SPACING.md
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10
    },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
    modalCloseBtn: { padding: 4 },
    selectorFilterRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: 10,
        marginBottom: SPACING.md
    },
    selectorFilterChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    selectorFilterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    selectorFilterText: { color: colors.textSecondary, fontSize: 13 },
    selectorList: { padding: SPACING.lg, paddingBottom: 100 },
    selectorBookItem: {
        flex: 1,
        margin: 6,
        height: 60,
        backgroundColor: colors.surface,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    selectorActiveItem: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.1)'
    },
    selectorBookName: { color: colors.text, fontSize: 14, fontWeight: '600' },

    chapterModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    chapterModalContainer: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: colors.surface,
        borderRadius: 30,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    chapterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    chapterModalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    chaptersGrid: { gap: 12, paddingBottom: 20 },
    chapterGridItem: {
        width: (Dimensions.get('window').width - 120) / 5,
        height: (Dimensions.get('window').width - 120) / 5,
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    chapterGridItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    chapterGridText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
    // Volume Control Styles
    volumeControlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 12,
        gap: 12,
        backgroundColor: colors.inputBg,
        padding: 12,
        borderRadius: 16
    },
    volumeBar: {
        flex: 1,
        height: 6,
        backgroundColor: colors.cardBorder,
        borderRadius: 3,
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden'
    },
    volumeFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3
    },
    volumeTouchInfo: {
        position: 'absolute',
        top: -10,
        bottom: -10,
        width: '50%',
        zIndex: 10
        // Left half decrements, right half increments
    },
    playProgressContainer: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
    playButtonInner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    progressRing: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: colors.primary,
        borderStyle: 'dotted'
    },

    // Completion Overlay Styles
    completionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        padding: SPACING.xl,
    },
    completionCard: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 40,
        padding: 30,
        borderWidth: 2,
        borderColor: colors.primary, // Theme primary for glow
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        alignItems: 'center',
    },
    completionCongrats: {
        color: colors.accent, // Use accent color for congratulations
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    completionSub: {
        color: colors.text,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
        opacity: 0.8,
    },
    completionDivider: {
        alignItems: 'center',
        marginBottom: 40,
    },
    endOfText: {
        color: colors.textSecondary,
        fontSize: 20,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    bookFinishName: {
        color: colors.text,
        fontSize: 48,
        fontWeight: '900',
    },
    quizSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    testTheoryText: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    quizDesc: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    startQuizBtn: {
        width: '100%',
        backgroundColor: colors.primary, // Theme primary
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    startQuizText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    proceedBtn: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proceedText: {
        color: colors.textSecondary,
        fontSize: 18,
        fontWeight: '600',
    },

    // Progress Section Styles
    progressSection: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    progressLabel: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    progressBarContainer: {
        width: '100%',
        height: 12,
        width: '100%',
        height: 12,
        backgroundColor: colors.cardBorder,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 6,
    },

    quizContainer: { flex: 1, padding: SPACING.xl },
    quizHeader: { marginTop: 40, marginBottom: 40 },
    quizHeaderTitle: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 20 },
    quizProgressBar: { width: '100%', height: 10, backgroundColor: colors.cardBorder, borderRadius: 5, marginBottom: 20 },
    quizProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
    quizScoreGoal: { color: colors.text, fontSize: 18, fontWeight: '600' },

    quizContent: { flex: 1 },
    questionNum: { color: colors.text, fontSize: 28, fontWeight: '700', fontStyle: 'italic', marginBottom: 30 },
    optionsList: { marginBottom: 60 },
    optionText: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 15 },

    selectionRow: { flexDirection: 'row', gap: 15, marginBottom: 60 },
    letterBox: {
        width: 64,
        height: 64,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4
    },
    letterBoxSelected: { backgroundColor: colors.primary },
    letterText: { color: colors.text, fontSize: 24, fontWeight: '900' },

    nextBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    nextBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },

    // Result Styles
    quizResultContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    resultCongrats: { color: colors.text, fontSize: 20, textAlign: 'center', marginBottom: 40, lineHeight: 28 },
    scoreCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60
    },
    scoreBig: { color: colors.primary, fontSize: 100, fontWeight: '900' },
    scoreOutOf: { color: colors.text, fontSize: 24, fontWeight: '700' },

    correctionSection: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 },
    correctionLabel: { color: colors.textSecondary, fontSize: 18, marginBottom: 8 },
    correctionDetails: { color: colors.text, fontSize: 20, fontWeight: '600' },
    viewCorrections: { color: colors.primary, fontSize: 18, fontWeight: '700', textDecorationLine: 'underline' },

    toNextChapterBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    toNextBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
    backHomeBtn: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    backHomeText: { color: colors.text, fontSize: 18, fontWeight: '600' },

    // Channel List Styles
    channelContainer: { flex: 1 },
    channelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: 40 },
    channelTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    channelList: { padding: SPACING.lg },
    channelSectionLabel: { color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1 },
    channelCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    channelInfo: { flex: 1 },
    channelName: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
    channelHost: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
    channelTag: {
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8
    },
    channelTagText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    memberCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    memberText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },

    hostSection: { padding: SPACING.lg, paddingBottom: 40 },
    hostButton: { borderRadius: 16, overflow: 'hidden' },
    hostBtnGradient: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    hostBtnText: { color: colors.text, fontSize: 16, fontWeight: '800' },

    // Member Selection Styles
    memberSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    memberSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.05)'
    },
    memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    memberAvatar: { width: 44, height: 44, borderRadius: 22 },
    memberName: { color: colors.text, fontSize: 16, fontWeight: '600' },
    memberCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.cardBorder
    },
    memberCheckboxActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },

    // Group Setup Styles
    setupInputWrapper: { marginBottom: 24, paddingHorizontal: 4 },
    setupLabel: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    setupInput: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 60,
        color: colors.text,
        fontSize: 16,
    },
    verseContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    verseNumber: {
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 4,
        width: 24,
        textAlign: 'left'
    },

    // New Selection Toolbar Styles
    selectionToolbar: {
        position: 'absolute',
        bottom: 300,
        alignSelf: 'center',
        backgroundColor: colors.surface,
        borderRadius: 32,
        paddingHorizontal: 6,
        paddingVertical: 6,
        elevation: 20,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        width: '90%',
        maxWidth: 360
    },
    toolbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        height: 54
    },
    colorActions: {
        flexDirection: 'row',
        gap: 12
    },
    colorDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.cardBorder
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.cardBorder,
        marginHorizontal: 12
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    iconActionBtn: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
    },
    iconActionBg: {
        // backgroundColor: 'rgba(255,255,255,0.05)',
        // width: 32,
        // height: 32,
        // borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconActionLabel: {
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: '600'
    },
    closeActionBtn: {
        marginLeft: 8,
        padding: 4,
        backgroundColor: colors.cardBorder,
        borderRadius: 12
    }
});

export default BibleScreen;
