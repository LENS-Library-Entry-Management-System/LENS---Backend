import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
  audit_id: number;
  admin_id: number;
  action_type: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  target_table: string | null;
  target_id: number | null;
  description: string | null;
  timestamp: Date;
  ip_address: string | null;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'audit_id' | 'target_table' | 'target_id' | 'description' | 'ip_address'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public audit_id!: number;
  public admin_id!: number;
  public action_type!: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  public target_table!: string | null;
  public target_id!: number | null;
  public description!: string | null;
  public timestamp!: Date;
  public ip_address!: string | null;
}

AuditLog.init(
  {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM('view', 'edit', 'delete', 'export', 'login', 'logout'),
      allowNull: false,
    },
    target_table: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'AuditLog',
    timestamps: false,
  }
);

export default AuditLog;