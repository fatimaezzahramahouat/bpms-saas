import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository";

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
    "11-20": 20,
    "20-50": 50,
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

    return result;
  },

  async completeOrganisationInfo(organisationId: string, input: CompleteOrgInfoInput) {
    const orgInfo = await authRepository.createOrgInfo(organisationId, {
      logo: input.logo,
      website: input.website,
      city: input.city,
      domaine: input.domaine,
      address: input.address,
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
    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organisationId: user.organisationId,
        isAdmin: !!user.admin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return { token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
  },
};
