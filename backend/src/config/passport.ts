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
  // Create user ONLY
  const newUser = await prisma.$transaction(async (tx) => {

    const createdUser = await tx.user.create({
      data: {
        email,
        firstName: profile.name?.givenName || profile.displayName,
        lastName: profile.name?.familyName || "",
        googleId: profile.id,
        provider: "GOOGLE",
        profileCompleted: false,
      },
      include: {
        admin: true,
        rh: true,
        manager: true,
        employee: true
      }
    });

    // IMPORTANT: Make Google user ADMIN
    await tx.admin.create({
      data: {
        userId: createdUser.id
      }
    });

    return createdUser;
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
