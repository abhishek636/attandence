import mysql from 'mysql2/promise';
import { User, ActivityLog, WorkSession } from '../types';

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      this.pool = mysql.createPool({
        host: import.meta.env.VITE_DB_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_DB_PORT || '3306'),
        user: import.meta.env.VITE_DB_USER || 'root',
        password: import.meta.env.VITE_DB_PASSWORD || '',
        database: import.meta.env.VITE_DB_NAME || 'timetracker',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        idleTimeout: 300000,
        acquireTimeout: 60000
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();

      await this.initializeTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async ensureConnection() {
    if (!this.pool || !this.isInitialized) {
      await this.initializeConnection();
    }
  }

  private async initializeTables() {
    try {
      if (!this.pool) throw new Error('Database pool not initialized');
      
      const connection = await this.pool.getConnection();
      
      console.log('🔧 Creating database tables...');

      // Users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_checked_in BOOLEAN DEFAULT FALSE,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_working_time INT DEFAULT 0,
          INDEX idx_username (username),
          INDEX idx_role (role),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Activity logs table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          type ENUM('check-in', 'check-out', 'idle-start', 'idle-end', 'activity') NOT NULL,
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          metadata JSON,
          INDEX idx_user_id (user_id),
          INDEX idx_timestamp (timestamp),
          INDEX idx_type (type),
          INDEX idx_user_timestamp (user_id, timestamp),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Work sessions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS work_sessions (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          check_in_time DATETIME NOT NULL,
          check_out_time DATETIME NULL,
          total_active_time INT DEFAULT 0,
          idle_time INT DEFAULT 0,
          activity_count INT DEFAULT 0,
          date DATE NOT NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_date (date),
          INDEX idx_user_date (user_id, date),
          INDEX idx_check_in_time (check_in_time),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      connection.release();
      console.log('✅ Database tables created successfully');
      
      // Initialize seed data
      await this.seedDatabase();
    } catch (error) {
      console.error('❌ Error creating database tables:', error);
      throw error;
    }
  }

  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo - use bcrypt in production
    return btoa(password + 'timetracker_salt_2024');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // SEEDING FUNCTION
  async seedDatabase() {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      console.log('🌱 Checking for existing data...');
      
      const [adminRows] = await this.pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      ) as any[];
      
      if (adminRows[0].count > 0) {
        console.log('✅ Database already seeded');
        return;
      }

      console.log('🌱 Seeding database with initial data...');
      const now = new Date();
      
      // Create admin user
      const adminId = this.generateId();
      await this.pool.execute(`
        INSERT INTO users (id, username, name, password, role, created_at, last_activity, total_working_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'admin',
        'System Administrator',
        this.hashPassword('admin123'),
        'admin',
        now,
        now,
        0
      ]);

      // Create sample users with realistic data
      const sampleUsers = [
        { username: 'john.doe', name: 'John Doe', totalTime: 2400 }, // 40 hours
        { username: 'jane.smith', name: 'Jane Smith', totalTime: 1800 }, // 30 hours
        { username: 'mike.wilson', name: 'Mike Wilson', totalTime: 3600 }, // 60 hours
        { username: 'sarah.johnson', name: 'Sarah Johnson', totalTime: 1200 }, // 20 hours
        { username: 'david.brown', name: 'David Brown', totalTime: 2880 }, // 48 hours
        { username: 'lisa.davis', name: 'Lisa Davis', totalTime: 2160 } // 36 hours
      ];

      for (const userData of sampleUsers) {
        const userId = this.generateId();
        await this.pool.execute(`
          INSERT INTO users (id, username, name, password, role, created_at, last_activity, total_working_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          userData.username,
          userData.name,
          this.hashPassword('user123'),
          'user',
          now,
          now,
          userData.totalTime
        ]);

        // Create some sample work sessions for each user
        for (let i = 0; i < 5; i++) {
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() - i);
          
          const sessionId = this.generateId();
          const checkInTime = new Date(sessionDate);
          checkInTime.setHours(9, 0, 0, 0); // 9 AM
          
          const checkOutTime = new Date(sessionDate);
          checkOutTime.setHours(17, 30, 0, 0); // 5:30 PM
          
          const activeTime = 480; // 8 hours in minutes
          const activityCount = Math.floor(Math.random() * 200) + 50;
          
          await this.pool.execute(`
            INSERT INTO work_sessions (id, user_id, check_in_time, check_out_time, total_active_time, idle_time, activity_count, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            sessionId,
            userId,
            checkInTime,
            checkOutTime,
            activeTime,
            30, // 30 minutes idle
            activityCount,
            sessionDate.toISOString().split('T')[0]
          ]);
        }
      }

      console.log('✅ Database seeded successfully with:');
      console.log('   - 1 Admin user (admin/admin123)');
      console.log('   - 6 Regular users (username/user123)');
      console.log('   - Sample work sessions for each user');
      
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  // USER AUTHENTICATION METHODS
  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      console.log(`🔐 Authenticating user: ${username}`);
      
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      ) as any[];

      if (rows.length === 0) {
        console.log('❌ User not found');
        return null;
      }

      const user = rows[0];
      const isPasswordValid = this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return null;
      }

      console.log('✅ Authentication successful');
      
      // Update last activity
      await this.pool.execute(
        'UPDATE users SET last_activity = ? WHERE id = ?',
        [new Date(), user.id]
      );

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        password: user.password,
        role: user.role,
        createdAt: user.created_at.toISOString(),
        isCheckedIn: Boolean(user.is_checked_in),
        lastActivity: new Date().toISOString(),
        totalWorkingTime: user.total_working_time
      };
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  // USER MANAGEMENT METHODS
  async createUser(username: string, name: string, password: string): Promise<User | null> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const id = this.generateId();
      const hashedPassword = this.hashPassword(password);
      const now = new Date();

      await this.pool.execute(`
        INSERT INTO users (id, username, name, password, role, created_at, last_activity, total_working_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, username, name, hashedPassword, 'user', now, now, 0]);

      return await this.getUserById(id);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      ) as any[];

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id,
        username: row.username,
        name: row.name,
        password: row.password,
        role: row.role,
        createdAt: row.created_at.toISOString(),
        isCheckedIn: Boolean(row.is_checked_in),
        lastActivity: row.last_activity ? row.last_activity.toISOString() : new Date().toISOString(),
        totalWorkingTime: row.total_working_time
      };
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      ) as any[];

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id,
        username: row.username,
        name: row.name,
        password: row.password,
        role: row.role,
        createdAt: row.created_at.toISOString(),
        isCheckedIn: Boolean(row.is_checked_in),
        lastActivity: row.last_activity ? row.last_activity.toISOString() : new Date().toISOString(),
        totalWorkingTime: row.total_working_time
      };
    } catch (error) {
      console.error('❌ Error getting user by username:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(
        'SELECT * FROM users ORDER BY created_at DESC'
      ) as any[];

      return rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        password: row.password,
        role: row.role,
        createdAt: row.created_at.toISOString(),
        isCheckedIn: Boolean(row.is_checked_in),
        lastActivity: row.last_activity ? row.last_activity.toISOString() : new Date().toISOString(),
        totalWorkingTime: row.total_working_time
      }));
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  async updateUser(user: User): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      await this.pool.execute(`
        UPDATE users 
        SET username = ?, name = ?, password = ?, role = ?, 
            is_checked_in = ?, last_activity = ?, total_working_time = ?
        WHERE id = ?
      `, [
        user.username,
        user.name,
        user.password,
        user.role,
        user.isCheckedIn,
        new Date(user.lastActivity),
        user.totalWorkingTime,
        user.id
      ]);

      return true;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  }

  // ACTIVITY LOG METHODS
  async addActivityLog(log: ActivityLog): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      await this.pool.execute(`
        INSERT INTO activity_logs (id, user_id, type, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?)
      `, [
        log.id,
        log.userId,
        log.type,
        new Date(log.timestamp),
        log.metadata ? JSON.stringify(log.metadata) : null
      ]);

      return true;
    } catch (error) {
      console.error('❌ Error adding activity log:', error);
      return false;
    }
  }

  async getUserActivityLogs(userId: string, limit = 100): Promise<ActivityLog[]> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(`
        SELECT * FROM activity_logs 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [userId, limit]) as any[];

      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        timestamp: row.timestamp.toISOString(),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }));
    } catch (error) {
      console.error('❌ Error getting user activity logs:', error);
      return [];
    }
  }

  // WORK SESSION METHODS
  async addWorkSession(session: WorkSession): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      await this.pool.execute(`
        INSERT INTO work_sessions (id, user_id, check_in_time, check_out_time, 
                                 total_active_time, idle_time, activity_count, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.userId,
        new Date(session.checkInTime),
        session.checkOutTime ? new Date(session.checkOutTime) : null,
        session.totalActiveTime,
        session.idleTime,
        session.activityCount,
        session.date
      ]);

      return true;
    } catch (error) {
      console.error('❌ Error adding work session:', error);
      return false;
    }
  }

  async updateWorkSession(session: WorkSession): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      await this.pool.execute(`
        UPDATE work_sessions 
        SET check_out_time = ?, total_active_time = ?, idle_time = ?, activity_count = ?
        WHERE id = ?
      `, [
        session.checkOutTime ? new Date(session.checkOutTime) : null,
        session.totalActiveTime,
        session.idleTime,
        session.activityCount,
        session.id
      ]);

      return true;
    } catch (error) {
      console.error('❌ Error updating work session:', error);
      return false;
    }
  }

  async getCurrentWorkSession(userId: string): Promise<WorkSession | null> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(`
        SELECT * FROM work_sessions 
        WHERE user_id = ? AND check_out_time IS NULL 
        ORDER BY check_in_time DESC 
        LIMIT 1
      `, [userId]) as any[];

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        checkInTime: row.check_in_time.toISOString(),
        checkOutTime: row.check_out_time ? row.check_out_time.toISOString() : undefined,
        totalActiveTime: row.total_active_time,
        idleTime: row.idle_time,
        activityCount: row.activity_count,
        date: row.date
      };
    } catch (error) {
      console.error('❌ Error getting current work session:', error);
      return null;
    }
  }

  async getUserWorkSessions(userId: string): Promise<WorkSession[]> {
    try {
      await this.ensureConnection();
      if (!this.pool) throw new Error('Database pool not initialized');

      const [rows] = await this.pool.execute(`
        SELECT * FROM work_sessions 
        WHERE user_id = ? 
        ORDER BY check_in_time DESC
        LIMIT 50
      `, [userId]) as any[];

      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        checkInTime: row.check_in_time.toISOString(),
        checkOutTime: row.check_out_time ? row.check_out_time.toISOString() : undefined,
        totalActiveTime: row.total_active_time,
        idleTime: row.idle_time,
        activityCount: row.activity_count,
        date: row.date
      }));
    } catch (error) {
      console.error('❌ Error getting user work sessions:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.pool) return false;
      
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export const getDatabase = (): DatabaseManager => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
};

export { DatabaseManager };