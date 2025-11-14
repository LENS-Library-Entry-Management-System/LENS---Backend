import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface AdminAttributes {
  adminId: number;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'staff';
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Make passwordHash optional in creation
interface AdminCreationAttributes extends Optional<AdminAttributes, 'adminId' | 'lastLogin' | 'createdAt' | 'updatedAt'> {
  passwordHash: string; // Required for creation
}

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public adminId!: number;
  public username!: string;
  // Backing field for password; expose via getter/setter so ESLint recognizes usage
  private _passwordHash!: string;
  public get passwordHash(): string {
    return this._passwordHash;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public set passwordHash(value: string) {
    this._passwordHash = value;
  }
  public fullName!: string;
  public email!: string;
  public role!: 'super_admin' | 'staff';
  public lastLogin!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to compare passwords
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Instance method to get safe admin data (without password)
  public toSafeObject() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeAdmin } = this.get();
    return safeAdmin;
  }
}

Admin.init(
  {
    adminId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'admin_id',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'full_name',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
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
    tableName: 'admins',
    timestamps: true,
    hooks: {
      beforeCreate: async (admin: Admin) => {
        if (admin.passwordHash) {
          // ✅ Using bcryptjs
          // eslint-disable-next-line no-param-reassign
          admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
        }
      },
      beforeUpdate: async (admin: Admin) => {
        if (admin.changed('passwordHash')) {
          // ✅ Using bcryptjs
          // eslint-disable-next-line no-param-reassign
          admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
        }
      },
    },
  }
);

export default Admin;