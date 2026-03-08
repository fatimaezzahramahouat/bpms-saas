import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../lib/prisma";

// Google Strategy Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        // 1. Check if user already exists by email
        let user = await prisma.user.findUnique({
          where: { email },
          include: {
            admin: true,
            rh: true,
            manager: true,
            employee: true
          }
        });

        if (user) {
          // 2. If user exists, update googleId and provider if needed
          if (!user.googleId || user.provider !== "GOOGLE") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                provider: "GOOGLE",
              },
              include: {
                admin: true,
                rh: true,
                manager: true,
                employee: true
              }
            });
          }
          return done(null, user);
        } else {
          // 3. If user doesn't exist, create a new one
          // Note: Since organisationId is required, we create a default organisation for the user
          const newUser = await prisma.$transaction(async (tx) => {
            const organisation = await tx.organisation.create({
              data: {
                name: `${profile.displayName}'s Organisation`,
                nom_admin: profile.displayName,
                email: email,
                password: "", // No password for Google users
              },
            });

            return tx.user.create({
              data: {
                email,
                firstName: profile.name?.givenName || profile.displayName,
                lastName: profile.name?.familyName || "",
                googleId: profile.id,
                provider: "GOOGLE",
                organisationId: organisation.id,
                profileCompleted: false,
              },
              include: {
                admin: true,
                rh: true,
                manager: true,
                employee: true
              }
            });
          });

          return done(null, newUser);
        }
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// We don't use passport sessions, we use JWT
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
