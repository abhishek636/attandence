import mysql from 'mysql2/promise';
import { User, ActivityLog, WorkSession } from '../types';

class DatabaseManager {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: import.meta.env.VITE_DB_HOST || process.env.DB_HOST,
      port: parseInt(import.meta.env.VITE_DB_PORT || process.env.DB_PORT || '3306'),
      user: import.meta.env.VITE_DB_USER || process.env.DB_USER,
      password: import.meta.env.VITE_DB_PASSWORD || process.env.DB_PASSWORD,
      database: import.meta.env.VITE_DB_NAME || process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
    });
    
    this.initializeTables();
  }

  private async initializeTables() {
    try {
      const connection = await this.pool.getConnection();
      
      // Users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
          created_at DATETIME NOT NULL,
          is_checked_in BOOLEAN DEFAULT FALSE,
          last_activity DATETIME,
          total_working_time INT DEFAULT 0,
          INDEX idx_username (username),
          INDEX idx_role (role)
        )
      `);

      // Activity logs table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          type ENUM('check-in', 'check-out', 'idle-start', 'idle-end', 'activity') NOT NULL,
          timestamp DATETIME NOT NULL,
          metadata JSON,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_timestamp (user_id, timestamp),
          INDEX idx_type (type)
        )
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
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_date (user_id, date),
          INDEX idx_date (date)
        )
      `);

      connection.release();
      console.log('Database tables initialized successfully');
      
      // Initialize seed data
      await this.initializeSeedData();
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  private async initializeSeedData() {
    try {
      const [rows] = await this.pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      ) as any[];
      
      if (rows[0].count === 0) {
        const now = new Date();
        
        // Create default admin
        await this.pool.execute(`
          INSERT INTO users (id, username, name, password, role, created_at, last_activity)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          this.generateId(),
          'admin',
          'System Administrator',
          this.hashPassword('admin123'),
          'admin',
          now,
          now
        ]);

        // Create sample users
        const sampleUsers = [
          { username: 'john.doe', name: 'John Doe', totalTime: 480 },
          { username: 'jane.smith', name: 'Jane Smith', totalTime: 360 },
          { username: 'mike.wilson', name: 'Mike Wilson', totalTime: 720 },
          { username: 'sarah.johnson', name: 'Sarah Johnson', totalTime: 240 }
        ];

        for (const user of sampleUsers) {
          await this.pool.execute(`
            INSERT INTO users (id, username, name, password, role, created_at, last_activity, total_working_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            this.generateId(),
            user.username,
            user.name,
            this.hashPassword('user123'),
            'user',
            now,
            now,
            user.totalTime
          ]);
        }

        console.log('Seed data initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing seed data:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo - use bcrypt in production
    return btoa(password + 'salt123');
  }

  // User management methods
  async createUser(username: string, name: string, password: string): Promise<User | null> {
    try {
      const id = this.generateId();
      const hashedPassword = this.hashPassword(password);
      const now = new Date();

      await this.pool.execute(`
        INSERT INTO users (id, username, name, password, role, created_at, last_activity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, username, name, hashedPassword, 'user', now, now]);

      return await this.getUserById(id);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
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
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
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
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
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
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(user: User): Promise<boolean> {
    try {
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
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Activity logging methods
  async addActivityLog(log: ActivityLog): Promise<boolean> {
    try {
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
      console.error('Error adding activity log:', error);
      return false;
    }
  }

  async getUserActivityLogs(userId: string, limit = 100): Promise<ActivityLog[]> {
    try {
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
      console.error('Error getting user activity logs:', error);
      return [];
    }
  }

  // Work session methods
  async addWorkSession(session: WorkSession): Promise<boolean> {
    try {
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
      console.error('Error adding work session:', error);
      return false;
    }
  }

  async updateWorkSession(session: WorkSession): Promise<boolean> {
    try {
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
      console.error('Error updating work session:', error);
      return false;
    }
  }

  async getCurrentWorkSession(userId: string): Promise<WorkSession | null> {
    try {
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
      console.error('Error getting current work session:', error);
      return null;
    }
  }

  async getUserWorkSessions(userId: string): Promise<WorkSession[]> {
    try {
      const [rows] = await this.pool.execute(`
        SELECT * FROM work_sessions 
        WHERE user_id = ? 
        ORDER BY check_in_time DESC
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
      console.error('Error getting user work sessions:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
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