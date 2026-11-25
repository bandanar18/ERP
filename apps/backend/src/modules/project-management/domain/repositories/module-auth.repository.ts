import { PmModuleUser } from '@prisma/client';
import { PmProfile } from '../../application/dto/auth.dto.js';

export interface IModuleAuthRepository {
  findByEmail(email: string): Promise<PmModuleUser | null>;
  findByUsername(username: string): Promise<PmModuleUser | null>;
  findById(id: string): Promise<PmModuleUser | null>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  findProfile(userId: string): Promise<PmProfile | null>;
  updateProfile(
    userId: string,
    data: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null },
  ): Promise<PmProfile | null>;
  linkExternalId(pmUserId: string, erpUserId: string): Promise<void>;
  create(data: {
    email: string;
    password: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    status?: string;
    emailVerified?: boolean;
  }): Promise<PmModuleUser>;
}
