import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository";
import { mailService } from "./mail.service";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

interface RegisterInput {
  organisationName: string;
  adminName: string;
  phone_org: string;
  nb_employers: string;
  email: string;
  password: string;
}

interface CompleteOrgInfoInput {
  logo: string;
  website: string;
  city: string;
  domaine: string;
  address: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Map string range to integer
function mapNbEmployers(value: string): number {
  const mapping: Record<string, number> = {
    "1-10": 10,
    "11-50": 50,
    "51-200": 200,
    "200+": 500,
  };
  return mapping[value] ?? 0;
}

export const authService = {
  async registerOrganisation(input: RegisterInput) {
    // 1. Split adminName into firstName and lastName
    const nameParts = input.adminName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 3. Map nb_employers string to integer
    const nb_employers = mapNbEmployers(input.nb_employers);

    // 4. Create organisation + user + admin via repository
    const result = await authRepository.createOrganisationWithAdmin({
      organisationName: input.organisationName,
      adminName: input.adminName,
      email: input.email,
      hashedPassword,
      phone_org: input.phone_org,
      nb_employers,
      firstName,
      lastName,
    });

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        organisationId: result.organisation.id,
        role: "ADMIN", // Organization admin by default
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        organisationId: result.organisation.id,
        admin: result.admin
      }
    };
  },

  async completeOrganisationInfo(organisationId: string, input: CompleteOrgInfoInput) {
    const orgInfo = await authRepository.createOrgInfo(organisationId, {
      logo: input.logo ?? "",
      website: input.website ?? "",
      city: input.city ?? "",
      domaine: input.domaine ?? "",
      address: input.address ?? "",
    });

    return orgInfo;
  },

  async login(input: LoginInput) {
    // 1. Find user by email
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Compare password
    if (!user.password) {
      throw new Error("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // 3. Determine Role (Heritage Pattern)
    let role = "EMPLOYEE";
    if (user.admin) role = "ADMIN";
    else if (user.rh) role = "RH";
    else if (user.manager) role = "MANAGER";
    else if (user.employee) role = "EMPLOYEE";

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organisationId: user.organisationId,
        role: role,
        isAdmin: !!user.admin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: role,
        isAdmin: !!user.admin,
        isRH: !!user.rh,
        isManager: !!user.manager,
        isEmployee: !!user.employee
      }
    };
  },

  async getOrganisationProfile(organisationId: string) {
    return authRepository.findOrganisationById(organisationId);
  },
  async getOrganisationLogo(organisationId: string) {
    const org = await authRepository.getLogo(organisationId);
    return org?.orgInfo?.logo || "";
  },

  async forgotPassword(email: string) {
    // 1. Find user by email
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists. 
      // Use case: suggest account creation/contact admin if specifically asked, 
      // but standard practice is a generic message.
      // But the requirement says: "Not exists -> show message & suggest create account/contact admin."
      throw new Error("Cet email n'existe pas dans notre base de données.");
    }

    // 2. Generate secure token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // 3. Save to DB
    await authRepository.updateUserResetToken(user.id, token, expires);

    // 4. Send Email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await mailService.sendResetPasswordEmail(user.email, resetLink);

    return { message: "Email de réinitialisation envoyé." };
  },

  async resetPassword(token: string, newPassword: string) {
    // 1. Find user by token
    const user = await authRepository.findUserByResetToken(token);

    // 2. Verify token and expiration
    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      throw new Error("Le jeton de réinitialisation est invalide ou a expiré.");
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password and clear token
    await authRepository.updateUserPassword(user.id, hashedPassword);

    return { message: "Mot de passe réinitialisé avec succès." };
  },
};
