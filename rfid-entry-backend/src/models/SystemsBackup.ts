import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Admin from './Admin';

interface SystemBackupAttributes {
  backupId: number;
  createdBy: number;
  backupDate: Date;
  filePath: string;
  sizeMb: number;
  status: 'completed' | 'failed';
  backupType: 'full' | 'users' | 'entries' | 'admins';
  description: string | null;
}

interface SystemBackupCreationAttributes extends Optional<SystemBackupAttributes, 'backupId' | 'description'> {}

class SystemBackup extends Model<SystemBackupAttributes, SystemBackupCreationAttributes> implements SystemBackupAttributes {
  public backupId!: number;
  public createdBy!: number;
  public backupDate!: Date;
  public filePath!: string;
  public sizeMb!: number;
  public status!: 'completed' | 'failed';
  public backupType!: 'full' | 'users' | 'entries' | 'admins';
  public description!: string | null;

  // Association
  public readonly admin?: Admin;
}

SystemBackup.init(
  {
    backupId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'backup_id',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
    },
    backupDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'backup_date',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
    },
    sizeMb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'size_mb',
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed'),
      allowNull: false,
      defaultValue: 'completed',
    },
    backupType: {
      type: DataTypes.ENUM('full', 'users', 'entries', 'admins'),
      allowNull: false,
      defaultValue: 'full',
      field: 'backup_type',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'system_backups',
    timestamps: false,
  }
);

// Define associations
SystemBackup.belongsTo(Admin, { foreignKey: 'createdBy', as: 'admin' });
Admin.hasMany(SystemBackup, { foreignKey: 'createdBy', as: 'backups' });

export default SystemBackup;