import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Service for managing STOP Card reports in Firestore
export class StopCardReportsService {
  static collectionName = 'stopCardReports';

  // Get all reports for a specific user
  static async getUserReports(companyId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userInfo.companyId', '==', companyId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp in JavaScript and limit results
      return reports
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw error;
    }
  }

  // Get reports for a specific date range
  static async getReportsByDateRange(startDate, endDate, companyId = null) {
    try {
      // Use simple query and filter in JavaScript
      let q = query(collection(db, this.collectionName));

      if (companyId) {
        q = query(
          collection(db, this.collectionName),
          where('userInfo.companyId', '==', companyId)
        );
      }

      const querySnapshot = await getDocs(q);
      const allReports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by date range and sort in JavaScript
      return allReports
        .filter(report => {
          const reportDate = report.siteInfo?.date;
          return reportDate && reportDate >= startDate && reportDate <= endDate;
        })
        .sort((a, b) => new Date(b.siteInfo?.date || 0) - new Date(a.siteInfo?.date || 0));
    } catch (error) {
      console.error('Error getting reports by date range:', error);
      throw error;
    }
  }

  // Get reports for a specific site
  static async getReportsBySite(siteName, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('siteInfo.site', '==', siteName)
      );

      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp in JavaScript and limit results
      return reports
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting reports by site:', error);
      throw error;
    }
  }

  // Get reports with unsafe acts
  static async getReportsWithUnsafeActs(companyId = null, limitCount = 50) {
    try {
      // Use simple query and filter in JavaScript
      let q = query(collection(db, this.collectionName));

      if (companyId) {
        q = query(
          collection(db, this.collectionName),
          where('userInfo.companyId', '==', companyId)
        );
      }

      const querySnapshot = await getDocs(q);
      const allReports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter and sort in JavaScript
      return allReports
        .filter(report => (report.safetyActs?.unsafeActsCount || 0) > 0)
        .sort((a, b) => (b.safetyActs?.unsafeActsCount || 0) - (a.safetyActs?.unsafeActsCount || 0))
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting reports with unsafe acts:', error);
      throw error;
    }
  }

  // Get a specific report by ID
  static async getReportById(reportId) {
    try {
      const docRef = doc(db, this.collectionName, reportId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Report not found');
      }
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw error;
    }
  }

  // Get analytics data for a company
  static async getCompanyAnalytics(companyId) {
    try {
      const reports = await this.getUserReports(companyId, 1000); // Get more for analytics
      
      const analytics = {
        totalReports: reports.length,
        totalSafeActs: reports.reduce((sum, report) => sum + (report.safetyActs?.safeActsCount || 0), 0),
        totalUnsafeActs: reports.reduce((sum, report) => sum + (report.safetyActs?.unsafeActsCount || 0), 0),
        averageActionsCompletion: reports.reduce((sum, report) => sum + (report.completionRates?.actionsCompletion || 0), 0) / reports.length,
        averageConditionsCompletion: reports.reduce((sum, report) => sum + (report.completionRates?.conditionsCompletion || 0), 0) / reports.length,
        totalObservationTime: reports.reduce((sum, report) => sum + (report.observationData?.durationMinutes || 0), 0),
        totalPeopleObserved: reports.reduce((sum, report) => sum + (report.observationData?.peopleObserved || 0), 0),
        sitesVisited: [...new Set(reports.map(report => report.siteInfo?.site).filter(Boolean))],
        recentReports: reports.slice(0, 10)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting company analytics:', error);
      throw error;
    }
  }
}

export default StopCardReportsService;