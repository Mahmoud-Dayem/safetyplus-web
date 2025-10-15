import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/color';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import StopCardReportsService from '../firebase/stopCardReportsService';
import StopCardModal from '../components/StopCardModal';
const ReportHistory = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  const name = user?.displayName;
  const id = user?.companyId;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  useEffect(() => {
    loadCachedReports();
  }, [id]);

  // Load reports from AsyncStorage cache
  const loadCachedReports = async () => {
    try {
      if (id) {
        const cacheKey = `reports_${id}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const allReports = JSON.parse(cachedData);
          setReports(allReports);
         } else {
          setReports([]); // No cached data
        }
      }
    } catch (error) {
      console.error('Error loading cached reports:', error);
      setReports([]);
    }
  };

  // Fetch fresh reports from Firestore and cache them
  const fetchReportsFromFirestore = async () => {
    try {
      setRefreshing(true);
      if (id) {
        const userReports = await StopCardReportsService.getUserReports(id, 200);



        // Cache the reports
        const cacheKey = `reports_${id}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(userReports));

        // Display reports
        setReports(userReports);

        // Alert.alert('Success', `Loaded ${userReports.length} reports from cloud`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reports from cloud. Please try again.');
      console.error('Error fetching reports:', error);
    } finally {
      setRefreshing(false);
    }
  };



  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleReportPress = (item) => {
    setVisible(true);
 
  }
  const renderReportCard = ({ item }) => (
    <TouchableOpacity onPress={() => {
      setSelectedReport(item); // store selected report
      setVisible(true);        // open modal
    }}>



      <View style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View style={styles.siteContainer}>
            <Text style={styles.siteLabel}>SITE</Text>
            <Text style={styles.siteValue}>{item.siteInfo?.site || 'Unknown Site'}</Text>
          </View>
          <Text style={styles.dateText}>{item.siteInfo?.date}</Text>
        </View>
        <View style={styles.areaRow}>
          <Text style={styles.areaLabel}>AREA</Text>
          <Text style={styles.areaValue}>{item.siteInfo?.area || 'Unknown Area'}</Text>
        </View>
      </View>

    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.primary || '#FF9500'}
        translucent={false}
        hidden={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Report History</Text>
          <View style={styles.headerUserInfoRow}>
            <Text style={styles.headerUserName}>{name || 'User'}</Text>
            <Text style={styles.headerSeparator}>•</Text>
            <Text style={styles.headerCompanyId}>ID: {id || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchReportsFromFirestore}
            disabled={refreshing}
          >
            <Ionicons
              name={refreshing ? "sync" : "cloud-download-outline"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Create New Report Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('StopCard')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New Report</Text>
        </TouchableOpacity>

        {/* Reports Count */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>My Reports</Text>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {refreshing ? 'Syncing...' : `${reports.length} Report${reports.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Refreshing Indicator */}
        {refreshing && (
          <View style={styles.refreshingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.refreshingText}>Fetching reports from cloud...</Text>
          </View>
        )}

        {/* Reports List */}
        {reports.length === 0 && !refreshing ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={colors.textSecondary || '#8E8E93'}
            />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              No safety reports found. Create your first report to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportCard}
            keyExtractor={(item) => item.id}
            style={styles.reportsList}
            scrollEnabled={false}
          />
        )}
       {selectedReport && (
        <StopCardModal
          data={selectedReport}
          visible={visible}
          setVisible={setVisible}
        />
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FA',
  },
  header: {
    backgroundColor: colors.primary || '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 8,
  },
  headerCompanyId: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  homeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.primary || '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
    marginBottom: 15,
  },
  countContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary || '#FF9500',
  },
  reportsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary || '#8E8E93',
    marginTop: 12,
  },
  refreshingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshingText: {
    fontSize: 16,
    color: colors.primary || '#FF9500',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary || '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 30,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  siteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  siteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary || '#FF9500',
    marginRight: 8,
  },
  siteValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary || '#8E8E93',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary || '#FF9500',
    marginRight: 8,
  },
  areaValue: {
    fontSize: 14,
    color: colors.text || '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
});

export default ReportHistory;