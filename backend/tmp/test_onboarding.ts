import { authService } from "../src/services/auth.service";
import { authRepository } from "../src/repositories/auth.repository";
import prisma from "../src/lib/prisma";

async function testOnboarding() {
  console.log("Starting onboarding verification...");

  try {
    // 1. Create a mock LOCAL user and organisation
    console.log("\nTesting LOCAL user onboarding...");
    const localEmail = `local_${Date.now()}@test.com`;
    const localReg = await authService.registerOrganisation({
      organisationName: "Local Org",
      adminName: "Local Admin",
      phone_org: "123456789",
      nb_employers: "1-10",
      email: localEmail,
      password: "password123"
    });

    // Complete onboarding for LOCAL user (should NOT require name/nb_employers)
    const localResult = await authService.completeOnboarding({
      organisationId: localReg.user.organisationId!,
      userId: localReg.user.id,
      email: localReg.user.email,
      orgInfo: {
        website: "https://local.com",
        city: "Local City",
        domaine: "Tech",
        address: "123 Local St",
        emailorg: "contact@local.com",
        phoneorg: "987654321",
        logo: "logo_url"
      }
    });
    console.log("LOCAL onboarding success:", localResult.user.profileCompleted === true);

    // 2. Create a mock GOOGLE user and organisation
    console.log("\nTesting GOOGLE user onboarding...");
    const googleEmail = `google_${Date.now()}@test.com`;
    // Manually create organisation and user to simulate Google login
    const googleOrg = await authRepository.createOrganisationWithAdmin({
        organisationName: "Temp Google Org",
        adminName: "Google Admin",
        email: googleEmail,
        hashedPassword: "",
        phone_org: "",
        nb_employers: 0,
        firstName: "Google",
        lastName: "Admin"
    });
    
    // Update user to GOOGLE provider
    // @ts-ignore
    await prisma.user.update({
        where: { id: googleOrg.user.id },
        data: { provider: "GOOGLE" }
    });

    // Complete onboarding for GOOGLE user (should include name/nb_employers)
    const googleResult = await authService.completeOnboarding({
      organisationId: googleOrg.organisation.id,
      userId: googleOrg.user.id,
      email: googleOrg.user.email,
      orgInfo: {
        website: "https://google.com",
        city: "Google City",
        domaine: "Google Domaine",
        address: "Google Address",
        emailorg: "googleorg@test.com",
        phoneorg: "0987654321",
        logo: "logo_url"
      },
      organisation: {
        name: "Google Updated Org",
        nb_employers: "51-200"
      }
    });

    console.log("GOOGLE onboarding success:", googleResult.user.profileCompleted === true);
    
    // Verify organisation update
    const updatedOrg = await prisma.organisation.findUnique({
      where: { id: googleOrg.organisation.id }
    });
    console.log("GOOGLE Org Name updated:", updatedOrg?.name === "Google Updated Org");
    console.log("GOOGLE Org Size updated:", updatedOrg?.nb_employers === 200);

    // 3. NEW SCENARIO: Google user WITHOUT initial organisation
    console.log("\nTesting GOOGLE user WITHOUT initial organisation...");
    const googleUserNoOrg = await prisma.user.create({
      data: {
        email: `google_no_org_${Date.now()}@test.com`,
        firstName: "Google",
        lastName: "NoOrg",
        provider: "GOOGLE",
        profileCompleted: false,
      }
    });

    const googleNoOrgResult = await authService.completeOnboarding({
        organisationId: null,
        userId: googleUserNoOrg.id,
        email: googleUserNoOrg.email,
        orgInfo: {
            website: "https://google-no-org.com",
            city: "NoOrg City",
            domaine: "NoOrg Domaine",
            address: "NoOrg Address",
            emailorg: "noorg@test.com",
            phoneorg: "1122334455",
            logo: "logo_url"
        },
        organisation: {
            name: "New Created Org",
            nb_employers: "1-10"
        }
    });

    console.log("GOOGLE (No Org) onboarding success:", googleNoOrgResult.user.profileCompleted === true);
    console.log("GOOGLE (No Org) organisation linked:", googleNoOrgResult.user.organisationId !== null);
    
    const createdOrg = await prisma.organisation.findFirst({
        where: { name: "New Created Org" }
    });
    console.log("GOOGLE (No Org) organisation created:", !!createdOrg);

  } catch (error) {
    console.error("Verification failed:", error);
  }
}

testOnboarding();
