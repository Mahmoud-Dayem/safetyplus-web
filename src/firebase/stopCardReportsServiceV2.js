import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Optimized service using daily documents for STOP Card reports
export class StopCardReportsServiceV2 {
  static collectionName = 'stopCardReportsV2';

  // Save a new report to today's document (optimized schema)
  static async saveReport(reportData) {
    try {
      // 1. Get today's date string: YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // 2. Reference to today's document
      const docRef = doc(db, this.collectionName, today);

      // 3. Add timestamp and unique ID to report
      const newReport = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        timestamp: new Date(),
        ...reportData,
      };

      // 4. Check if today's document exists
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 5a. Document exists → append new report
        const currentData = docSnap.data();
        await updateDoc(docRef, {
          reports: arrayUnion(newReport),
          lastUpdated: new Date(),
          reportCount: (currentData.reportCount || 0) + 1
        });
       } else {
        // 5b. Document does not exist → create new with first report
        await setDoc(docRef, {
          date: today,
          reports: [newReport],
          created_at: new Date(),
          lastUpdated: new Date(),
          reportCount: 1
        });
       }

      return { success: true, reportId: newReport.id, date: today };
    } catch (error) {
      console.error("❌ Error saving report to V2 schema:", error.message);
      throw error;
    }
  }

  // Get all reports for a specific user (optimized)
  static async getUserReports(companyId, limitCount = 50) {
    try {
      // Get all daily documents
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc'),
        limit(365) // Limit to last year of daily documents
      );
      
      const querySnapshot = await getDocs(q);
      const userReports = [];

      // Extract user's reports from daily documents
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          const userDayReports = data.reports.filter(report => 
            report.userInfo?.companyId === parseInt(companyId)
          );
          userReports.push(...userDayReports);
        }
      });

      // Sort by timestamp and limit results
      return userReports
        .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting user reports from V2 schema:', error);
      throw error;
    }
  }

  // Get monthly counts for a specific user and year (highly optimized)
  static async getUserMonthlyCounts(companyId, year) {
    try {
      // Calculate date range for the year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Query daily documents for the year
      const q = query(
        collection(db, this.collectionName),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      const monthlyCounts = new Array(12).fill(0);
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          // Filter user's reports for this day
          const userDayReports = data.reports.filter(report => 
            report.userInfo?.companyId === parseInt(companyId)
          );
          
          if (userDayReports.length > 0) {
            // Get month from document date (YYYY-MM-DD)
            const month = parseInt(data.date.split('-')[1]) - 1; // 0-based
            monthlyCounts[month] += userDayReports.length;
          }
        }
      });
      
      return monthlyCounts;
    } catch (error) {
      console.error('Error getting monthly counts from V2 schema:', error);
      throw error;
    }
  }

  // Get total report count for a user (super efficient)
  static async getUserReportCount(companyId) {
    try {
      // Get all daily documents
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      
      let totalCount = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          const userDayCount = data.reports.filter(report => 
            report.userInfo?.companyId === parseInt(companyId)
          ).length;
          totalCount += userDayCount;
        }
      });
      
      return totalCount;
    } catch (error) {
      console.error('Error getting user report count from V2 schema:', error);
      throw error;
    }
  }

  // Get reports for a specific date range
  static async getReportsByDateRange(startDate, endDate, companyId = null) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          let dayReports = data.reports;
          
          // Filter by company if specified
          if (companyId) {
            dayReports = dayReports.filter(report => 
              report.userInfo?.companyId === parseInt(companyId)
            );
          }
          
          reports.push(...dayReports);
        }
      });

      return reports.sort((a, b) => 
        new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
      );
    } catch (error) {
      console.error('Error getting reports by date range from V2 schema:', error);
      throw error;
    }
  }

  // Get all reports for all users (admin function, with pagination)
  static async getAllReports(limitDays = 30) {
    try {
      // Get recent daily documents
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc'),
        limit(limitDays)
      );

      const querySnapshot = await getDocs(q);
      const allReports = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          allReports.push(...data.reports);
        }
      });

      // Sort by timestamp
      return allReports.sort((a, b) => 
        new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
      );
    } catch (error) {
      console.error('Error getting all reports from V2 schema:', error);
      throw error;
    }
  }

  // Get reports with unsafe acts (optimized)
  static async getReportsWithUnsafeActs(companyId = null, limitDays = 30) {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc'),
        limit(limitDays)
      );

      const querySnapshot = await getDocs(q);
      const unsafeReports = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          let dayReports = data.reports;
          
          // Filter by company if specified
          if (companyId) {
            dayReports = dayReports.filter(report => 
              report.userInfo?.companyId === parseInt(companyId)
            );
          }
          
          // Filter for reports with unsafe acts
          const unsafeDayReports = dayReports.filter(report => {
            const hasUnsafeActs = report.safetyActs?.unsafeActs?.some(act => act.checked);
            return hasUnsafeActs;
          });
          
          unsafeReports.push(...unsafeDayReports);
        }
      });

      return unsafeReports.sort((a, b) => 
        new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
      );
    } catch (error) {
      console.error('Error getting reports with unsafe acts from V2 schema:', error);
      throw error;
    }
  }

  // Migration helper: Get document count comparison
  static async getSchemaStats() {
    try {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      
      let totalDocuments = querySnapshot.docs.length;
      let totalReports = 0;
      let dateRange = { earliest: null, latest: null };
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.reports && Array.isArray(data.reports)) {
          totalReports += data.reports.length;
        }
        
        if (data.date) {
          if (!dateRange.earliest || data.date < dateRange.earliest) {
            dateRange.earliest = data.date;
          }
          if (!dateRange.latest || data.date > dateRange.latest) {
            dateRange.latest = data.date;
          }
        }
      });
      
      return {
        totalDocuments,
        totalReports,
        dateRange,
        averageReportsPerDocument: totalReports / totalDocuments || 0
      };
    } catch (error) {
      console.error('Error getting schema stats:', error);
      throw error;
    }
  }
}

export default StopCardReportsServiceV2;