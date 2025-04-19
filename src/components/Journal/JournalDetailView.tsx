import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert
} from 'react-native';
import { JournalEntry } from '../../services/OfflineManager';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

interface JournalDetailViewProps {
  entry: JournalEntry;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
}

/**
 * Komponente zur detaillierten Anzeige eines Journal-Eintrags
 */
const JournalDetailView: React.FC<JournalDetailViewProps> = ({ entry, onBack, onEdit }) => {
  // Formatiertes Datum für die Anzeige
  const formattedDate = dayjs(entry.created_at).format('DD. MMMM YYYY');
  const formattedTime = dayjs(entry.created_at).format('HH:mm');
  
  // Teilen des Eintrags (nur wenn nicht verschlüsselt)
  const handleShare = async () => {
    if (entry.isEncrypted) {
      Alert.alert(
        'Hinweis',
        'Verschlüsselte Einträge können nicht geteilt werden. Deaktivieren Sie die Verschlüsselung, wenn Sie diesen Eintrag teilen möchten.'
      );
      return;
    }
    
    try {
      await Share.share({
        message: `${entry.title}\n\n${entry.content}\n\nErstellt am: ${formattedDate}`,
        title: entry.title
      });
    } catch (error) {
      console.error('Fehler beim Teilen des Eintrags:', error);
    }
  };
  
  // Emoji für die Stimmung
  let moodDisplay = null;
  if (entry.mood) {
    let emoji = '';
    let moodText = '';
    
    switch (entry.mood) {
      case 'great':
        emoji = '😃';
        moodText = 'Großartig';
        break;
      case 'good':
        emoji = '🙂';
        moodText = 'Gut';
        break;
      case 'neutral':
        emoji = '😐';
        moodText = 'Neutral';
        break;
      case 'bad':
        emoji = '☹️';
        moodText = 'Schlecht';
        break;
      case 'terrible':
        emoji = '😣';
        moodText = 'Furchtbar';
        break;
    }
    
    moodDisplay = (
      <View style={styles.moodContainer}>
        <Text style={styles.moodEmoji}>{emoji}</Text>
        <Text style={styles.moodText}>{moodText}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={24} color="#333333" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onEdit(entry)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="pencil" size={24} color="#333333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="share-variant" size={24} color="#333333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{entry.title}</Text>
          {entry.isEncrypted && (
            <Icon name="lock" size={20} color="#4A90E2" style={styles.lockIcon} />
          )}
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Icon name="calendar" size={16} color="#7A7A7A" style={styles.dateIcon} />
          <Text style={styles.dateTime}>{formattedDate} um {formattedTime}</Text>
        </View>
        
        {moodDisplay}
        
        <View style={styles.contentBox}>
          <Text style={styles.content}>{entry.content}</Text>
        </View>
        
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsList}>
              {entry.tags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {entry.location && (
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>Standort</Text>
            <View style={styles.locationBox}>
              <Icon name="map-marker" size={18} color="#4A90E2" style={styles.locationIcon} />
              <Text style={styles.locationText}>
                {entry.location.description || 'Unbekannter Standort'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  lockIcon: {
    marginLeft: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodText: {
    fontSize: 14,
    color: '#555555',
  },
  contentBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#555555',
  },
});

export default JournalDetailView;