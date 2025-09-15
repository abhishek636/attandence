import { User, ActivityLog, WorkSession } from '../types';
import { getDatabase } from './database';

// Database-based storage implementation
class DatabaseStorage {
  private db = getDatabase();

  // Users
  async getUsers(): Promise<User[]> {
    return await this.db.getAllUsers();
  }

  async setUsers(users: User[]): Promise<void> {
    // This method is not needed for database implementation
    // but kept for compatibility
    console.warn('setUsers is not implemented for database storage');
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.db.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.db.getUserByUsername(username);
  }

  async createUser(user: User): Promise<void> {
    await this.db.createUser(user.username, user.name, user.password);
  }

  async updateUser(updatedUser: User): Promise<void> {
    await this.db.updateUser(updatedUser);
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    // This method returns all logs, which might be expensive
    // Consider implementing pagination or limiting
    console.warn('getActivityLogs returns all logs - consider using getUserActivityLogs instead');
    return [];
  }

  async setActivityLogs(logs: ActivityLog[]): Promise<void> {
    // This method is not needed for database implementation
    console.warn('setActivityLogs is not implemented for database storage');
  }

  async addActivityLog(log: ActivityLog): Promise<void> {
    await this.db.addActivityLog(log);
  }

  async getUserActivityLogs(userId: string, limit = 100): Promise<ActivityLog[]> {
    return await this.db.getUserActivityLogs(userId, limit);
  }

  // Work Sessions
  async getWorkSessions(): Promise<WorkSession[]> {
    // This method returns all sessions, which might be expensive
    console.warn('getWorkSessions returns all sessions - consider using getUserWorkSessions instead');
    return [];
  }

  async setWorkSessions(sessions: WorkSession[]): Promise<void> {
    // This method is not needed for database implementation
    console.warn('setWorkSessions is not implemented for database storage');
  }

  async addWorkSession(session: WorkSession): Promise<void> {
    await this.db.addWorkSession(session);
  }

  async updateWorkSession(updatedSession: WorkSession): Promise<void> {
    await this.db.updateWorkSession(updatedSession);
  }

  async getUserWorkSessions(userId: string): Promise<WorkSession[]> {
    return await this.db.getUserWorkSessions(userId);
  }

  async getCurrentWorkSession(userId: string): Promise<WorkSession | null> {
    return await this.db.getCurrentWorkSession(userId);
  }
}

export const storage = new DatabaseStorage();