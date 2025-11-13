import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  userId: number;
  idNumber: string;
  rfidTag: string;
  firstName: string;
  lastName: string;
  email: string | null;
  userType: 'student' | 'faculty';
  college: string;
  department: string;
  yearLevel: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'userId' | 'email' | 'yearLevel' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: number;
  public idNumber!: string;
  public rfidTag!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string | null;
  public userType!: 'student' | 'faculty';
  public college!: string;
  public department!: string;
  public yearLevel!: string | null;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

User.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'user_id',
    },
    idNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'id_number',
    },
    rfidTag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'rfid_tag',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    userType: {
      type: DataTypes.ENUM('student', 'faculty'),
      allowNull: false,
      field: 'user_type',
    },
    college: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    yearLevel: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'year_level',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;