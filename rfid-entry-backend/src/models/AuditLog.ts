import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Admin from './Admin';

interface AuditLogAttributes {
  auditId: number;
  adminId: number;
  actionType: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  targetTable: string | null;
  targetId: number | null;
  description: string | null;
  timestamp: Date;
  ipAddress: string | null;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'auditId' | 'targetTable' | 'targetId' | 'description' | 'ipAddress'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public auditId!: number;
  public adminId!: number;
  public actionType!: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  public targetTable!: string | null;
  public targetId!: number | null;
  public description!: string | null;
  public timestamp!: Date;
  public ipAddress!: string | null;
}

AuditLog.init(
  {
    auditId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'audit_id',
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'admin_id',
    },
    actionType: {
      type: DataTypes.ENUM('view', 'edit', 'delete', 'export', 'login', 'logout'),
      allowNull: false,
      field: 'action_type',
    },
    targetTable: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'target_table',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_id',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
  }
);

// Define associations
AuditLog.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });
Admin.hasMany(AuditLog, { foreignKey: 'adminId', as: 'auditLogs' });

export default AuditLog;