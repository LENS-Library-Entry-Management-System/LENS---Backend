import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface EntryLogAttributes {
  logId: number;
  userId: number;
  entryTimestamp: Date;
  entryMethod: 'rfid' | 'manual';
  status: 'success' | 'duplicate' | 'error';
  createdAt: Date;
}

interface EntryLogCreationAttributes extends Optional<EntryLogAttributes, 'logId' | 'createdAt'> {}

class EntryLog extends Model<EntryLogAttributes, EntryLogCreationAttributes> implements EntryLogAttributes {
  public logId!: number;
  public userId!: number;
  public entryTimestamp!: Date;
  public entryMethod!: 'rfid' | 'manual';
  public status!: 'success' | 'duplicate' | 'error';
  public readonly createdAt!: Date;

  // Association
  public readonly user?: User;
}

EntryLog.init(
  {
    logId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'log_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    entryTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'entry_timestamp',
    },
    entryMethod: {
      type: DataTypes.ENUM('rfid', 'manual'),
      allowNull: false,
      field: 'entry_method',
    },
    status: {
      type: DataTypes.ENUM('success', 'duplicate', 'error'),
      allowNull: false,
      defaultValue: 'success',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'entry_logs',
    timestamps: false,
  }
);

// Define associations
EntryLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EntryLog, { foreignKey: 'userId', as: 'entryLogs' });

export default EntryLog;