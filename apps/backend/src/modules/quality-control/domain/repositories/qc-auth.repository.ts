import { QcUser, QcUserStatus } from '@prisma/client';
import { QcProfile } from '../../application/dto/qc-auth.dto.js';

export interface IQcAuthRepository {
  findByEmail(email: string): Promise<QcUser | null>;
  findByUsername(username: string): Promise<QcUser | null>;
  findById(id: string): Promise<QcUser | null>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  findProfile(userId: string): Promise<QcProfile | null>;
  linkExternalId(qcUserId: string, erpUserId: string): Promise<void>;
  findDefaultOrganizationId(): Promise<string | null>;
  findRoleIdByCode(code: string): Promise<string | null>;
  assignRole(userId: string, roleId: string): Promise<void>;
  create(data: {
    email: string;
    password: string;
    organizationId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    status?: QcUserStatus;
    emailVerified?: boolean;
  }): Promise<QcUser>;
}
