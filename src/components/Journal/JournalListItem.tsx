import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { JournalEntry } from '../../services/OfflineManager';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

interface JournalListItemProps {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
  onLongPress?: (entry: JournalEntry) => void;
}

/**
 * Komponente zur Anzeige eines Journal-Eintrags in einer Liste
 */
const JournalListItem: React.FC<JournalListItemProps> = ({ entry, onPress, onLongPress }) => {
  const formattedDate = dayjs(entry.created_at).format('DD.MM.YYYY');
  const time = dayjs(entry.created_at).format('HH:mm');
  
  // Emoji für die Stimmung
  let moodEmoji = '';
  if (entry.mood) {
    switch (entry.mood) {
      case 'great':
        moodEmoji = '😃';
        break;
      case 'good':
        moodEmoji = '🙂';
        break;
      case 'neutral':
        moodEmoji = '😐';
        break;
      case 'bad':
        moodEmoji = '☹️';
        break;
      case 'terrible':
        moodEmoji = '😣';
        break;
      default:
        moodEmoji = '';
    }
  }
  
  // Verkürzte Version des Inhalts
  const contentPreview = entry.content.length > 100 
    ? `${entry.content.substring(0, 100)}...` 
    : entry.content;
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(entry)}
      onLongPress={() => onLongPress && onLongPress(entry)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
          {entry.isEncrypted && (
            <Icon name="lock" size={16} color="#4A90E2" style={styles.lockIcon} />
          )}
        </View>
        <Text style={styles.dateTime}>
          {formattedDate} {time} {moodEmoji}
        </Text>
      </View>
      
      <Text style={styles.preview} numberOfLines={2}>
        {contentPreview}
      </Text>
      
      {entry.tags && entry.tags.length > 0 && (
        <View style={styles.tags}>
          {entry.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tag}>#{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 3 && (
            <Text style={styles.moreTags}>+{entry.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  lockIcon: {
    marginLeft: 8,
  },
  dateTime: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagContainer: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tag: {
    fontSize: 12,
    color: '#4A90E2',
  },
  moreTags: {
    fontSize: 12,
    color: '#7A7A7A',
    alignSelf: 'center',
  },
});

export default JournalListItem;